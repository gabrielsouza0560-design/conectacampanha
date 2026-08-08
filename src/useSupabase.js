import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";

const toSnake = (s) => s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

function mapKeys(obj, fn) {
  if (Array.isArray(obj)) return obj.map((v) => mapKeys(v, fn));
  if (obj && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => {
        const skip = k === "intencoes" || k === "opcoes";
        return [fn(k), skip ? v : mapKeys(v, fn)];
      })
    );
  }
  return obj;
}

const toDb = (row) => mapKeys(row, toSnake);
const fromDb = (row) => mapKeys(row, toCamel);

export function useSupabaseTable(table, fallback, orderCol = "id") {
  const [items, setItems] = useState(fallback);
  const [loading, setLoading] = useState(!!supabase);
  const loaded = useRef(false);

  useEffect(() => {
    if (!supabase || loaded.current) return;
    loaded.current = true;
    supabase
      .from(table)
      .select("*")
      .order(orderCol)
      .then(({ data, error }) => {
        if (!error && data?.length) setItems(data.map(fromDb));
        setLoading(false);
      });
  }, [table, orderCol]);

  const setAndSync = useCallback(
    (updater) => {
      setItems((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        return next;
      });
    },
    []
  );

  const insert = useCallback(
    async (row) => {
      const { id, createdAt, ...rest } = row;
      if (!supabase) {
        const fakeId = Math.max(0, ...items.map((i) => i.id)) + 1;
        const created = { ...row, id: fakeId };
        setItems((prev) => [created, ...prev]);
        return created;
      }
      const dbRow = toDb(rest);
      const { data, error } = await supabase
        .from(table)
        .insert(dbRow)
        .select()
        .single();
      if (error) {
        console.error(`insert ${table}:`, error);
        return null;
      }
      const mapped = fromDb(data);
      setItems((prev) => [mapped, ...prev]);
      return mapped;
    },
    [table, items]
  );

  const update = useCallback(
    async (id, changes) => {
      const { id: _, createdAt, ...rest } = changes;
      if (!supabase) {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));
        return;
      }
      const dbChanges = toDb(rest);
      const { error } = await supabase.from(table).update(dbChanges).eq("id", id);
      if (error) console.error(`update ${table}:`, error);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));
    },
    [table]
  );

  const remove = useCallback(
    async (id) => {
      if (supabase) {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) console.error(`delete ${table}:`, error);
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [table]
  );

  return { items, setItems: setAndSync, insert, update, remove, loading };
}

export function useSupabaseKV(table, fallback, keyCol = "cargo", valCol = "meta") {
  const [data, setData] = useState(fallback);
  const loaded = useRef(false);

  useEffect(() => {
    if (!supabase || loaded.current) return;
    loaded.current = true;
    supabase
      .from(table)
      .select("*")
      .then(({ data: rows, error }) => {
        if (!error && rows?.length) {
          const obj = {};
          rows.forEach((r) => { obj[r[keyCol]] = r[valCol]; });
          setData(obj);
        }
      });
  }, [table, keyCol, valCol]);

  const setValue = useCallback(
    async (key, value) => {
      setData((prev) => ({ ...prev, [key]: value }));
      if (!supabase) return;
      const { error } = await supabase
        .from(table)
        .upsert({ [keyCol]: key, [valCol]: value });
      if (error) console.error(`upsert ${table}:`, error);
    },
    [table, keyCol, valCol]
  );

  return { data, setData, setValue };
}
