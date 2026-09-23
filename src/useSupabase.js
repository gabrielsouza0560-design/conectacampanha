import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";
import { toast } from "./ui";

const avisarErro = (acao, error) => {
  console.error(acao, error);
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  toast(offline ? "Sem internet. Tente de novo quando a conexão voltar." : `Não foi possível ${acao}. Tente novamente.`, "erro");
};

const toSnake = (s) => s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const trimTime = (v) =>
  typeof v === "string" && /^\d{2}:\d{2}:\d{2}$/.test(v) ? v.slice(0, 5) : v;

function mapKeys(obj, fn, fixValues) {
  if (Array.isArray(obj)) return obj.map((v) => mapKeys(v, fn, fixValues));
  if (obj && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => {
        const skip = k === "intencoes" || k === "opcoes";
        const mapped = skip ? v : mapKeys(v, fn, fixValues);
        return [fn(k), fixValues ? fixValues(mapped) : mapped];
      })
    );
  }
  return fixValues ? fixValues(obj) : obj;
}

const toDb = (row) => mapKeys(row, toSnake);
const fromDb = (row) => mapKeys(row, toCamel, trimTime);

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
        if (error) avisarErro("carregar os dados", error);
        else if (data?.length) setItems(data.map(fromDb));
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
        toast("Cadastrado com sucesso");
        return created;
      }
      const dbRow = toDb(rest);
      const { data, error } = await supabase
        .from(table)
        .insert(dbRow)
        .select()
        .single();
      if (error) {
        avisarErro("salvar", error);
        return null;
      }
      const mapped = fromDb(data);
      setItems((prev) => [mapped, ...prev]);
      toast("Cadastrado com sucesso");
      return mapped;
    },
    [table, items]
  );

  // Insere vários registros de uma vez (um único pedido ao Supabase por lote).
  const insertMany = useCallback(
    async (rows) => {
      if (!rows.length) return [];
      if (!supabase) {
        let base = Math.max(0, ...items.map((i) => i.id));
        const created = rows.map((r) => ({ ...r, id: ++base }));
        setItems((prev) => [...created.slice().reverse(), ...prev]);
        return created;
      }
      const dbRows = rows.map(({ id, createdAt, ...rest }) => toDb(rest));
      const { data, error } = await supabase.from(table).insert(dbRows).select();
      if (error) {
        avisarErro("salvar", error);
        return null;
      }
      const mapped = data.map(fromDb);
      setItems((prev) => [...mapped.slice().reverse(), ...prev]);
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
      if (error) { avisarErro("salvar a alteração", error); return false; }
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));
      return true;
    },
    [table]
  );

  const remove = useCallback(
    async (id) => {
      if (supabase) {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) { avisarErro("excluir", error); return false; }
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      return true;
    },
    [table]
  );

  return { items, setItems: setAndSync, insert, insertMany, update, remove, loading };
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
      if (error) avisarErro("salvar a configuração", error);
    },
    [table, keyCol, valCol]
  );

  return { data, setData, setValue };
}
