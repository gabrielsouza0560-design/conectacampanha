-- ============================================================================
-- CONecta Campanha — Supabase schema
-- Projeto: lptqrrvbwwzdunuxvfvy
-- Rodar no SQL Editor do Supabase (https://supabase.com/dashboard/project/lptqrrvbwwzdunuxvfvy/sql)
-- ============================================================================

-- 1. Lideranças
create table if not exists liderancas (
  id bigint primary key generated always as identity,
  nome text not null,
  bairro text not null default '',
  telefone text not null default '',
  apoiadores integer not null default 0,
  status text not null default 'Ativa',
  created_at timestamptz not null default now()
);

-- 2. Eleitores
create table if not exists eleitores (
  id bigint primary key generated always as identity,
  nome text not null,
  telefone text not null default '',
  cpf text default '',
  bairro text not null default '',
  lideranca text not null default '',
  status text not null default 'Pendente',
  tags text[] not null default '{}',
  cadastro date not null default current_date,
  intencoes jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- 3. Demandas
create table if not exists demandas (
  id bigint primary key generated always as identity,
  solicitante text not null default '',
  categoria text not null default 'Outros',
  descricao text not null default '',
  bairro text not null default '',
  prioridade text not null default 'Média',
  status text not null default 'Nova',
  prazo date,
  created_at timestamptz not null default now()
);

-- 4. Agenda
create table if not exists agenda (
  id bigint primary key generated always as identity,
  titulo text not null default '',
  data date not null default current_date,
  hora time not null default '09:00',
  local text not null default '',
  responsavel text not null default '',
  created_at timestamptz not null default now()
);

-- 5. Gastos
create table if not exists gastos (
  id bigint primary key generated always as identity,
  descricao text not null default '',
  categoria text not null default 'Outros',
  valor numeric(12,2) not null default 0,
  data date,
  observacoes text not null default '',
  created_at timestamptz not null default now()
);

-- 6. Material
create table if not exists material (
  id bigint primary key generated always as identity,
  nome text not null default '',
  quantidade_total integer not null default 0,
  quantidade_distribuida integer not null default 0,
  custo_unitario numeric(10,2) not null default 0,
  observacoes text not null default '',
  created_at timestamptz not null default now()
);

-- 7. Visitas
create table if not exists visitas (
  id bigint primary key generated always as identity,
  pessoa text not null default '',
  endereco text not null default '',
  data date,
  hora time,
  assessor text not null default '',
  assunto text not null default '',
  resultado text not null default 'Positiva',
  proximos_passos text not null default '',
  created_at timestamptz not null default now()
);

-- 8. Eventos
create table if not exists eventos (
  id bigint primary key generated always as identity,
  nome text not null default '',
  data date,
  hora time,
  local text not null default '',
  responsavel text not null default '',
  publico_estimado integer not null default 0,
  observacoes text not null default '',
  created_at timestamptz not null default now()
);

-- 9. Tarefas
create table if not exists tarefas (
  id bigint primary key generated always as identity,
  titulo text not null default '',
  responsavel text not null default '',
  prazo date,
  prioridade text not null default 'Média',
  status text not null default 'Pendente',
  created_at timestamptz not null default now()
);

-- 10. Metas de votos
create table if not exists metas_votos (
  cargo text primary key,
  meta integer not null default 0
);

-- 11. Pesquisas
create table if not exists pesquisas (
  id bigint primary key generated always as identity,
  titulo text not null default '',
  data date,
  responsavel text not null default '',
  opcoes jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- 12. Documentos
create table if not exists documentos (
  id bigint primary key generated always as identity,
  nome text not null default '',
  categoria text not null default 'Outros',
  data date,
  link text not null default '',
  observacoes text not null default '',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- RLS — acesso público (sem auth por enquanto, protótipo)
-- ============================================================================
alter table liderancas enable row level security;
alter table eleitores enable row level security;
alter table demandas enable row level security;
alter table agenda enable row level security;
alter table gastos enable row level security;
alter table material enable row level security;
alter table visitas enable row level security;
alter table eventos enable row level security;
alter table tarefas enable row level security;
alter table metas_votos enable row level security;
alter table pesquisas enable row level security;
alter table documentos enable row level security;

create policy "allow_all" on liderancas for all using (true) with check (true);
create policy "allow_all" on eleitores for all using (true) with check (true);
create policy "allow_all" on demandas for all using (true) with check (true);
create policy "allow_all" on agenda for all using (true) with check (true);
create policy "allow_all" on gastos for all using (true) with check (true);
create policy "allow_all" on material for all using (true) with check (true);
create policy "allow_all" on visitas for all using (true) with check (true);
create policy "allow_all" on eventos for all using (true) with check (true);
create policy "allow_all" on tarefas for all using (true) with check (true);
create policy "allow_all" on metas_votos for all using (true) with check (true);
create policy "allow_all" on pesquisas for all using (true) with check (true);
create policy "allow_all" on documentos for all using (true) with check (true);

-- ============================================================================
-- Seed data (mesmos dados do protótipo)
-- ============================================================================

insert into liderancas (nome, bairro, telefone, apoiadores, status) values
  ('João Ferreira', 'Centro / Bela Vista', '(45) 99101-0001', 128, 'Ativa'),
  ('Rosa Lima', 'Vila Nova / São José', '(45) 99101-0002', 96, 'Ativa'),
  ('Marcos Souza', 'Industrial', '(45) 99101-0003', 54, 'Ativa');

insert into eleitores (nome, telefone, bairro, lideranca, status, tags, cadastro, intencoes) values
  ('Marta Aparecida Silva', '(45) 99911-2233', 'Centro', 'João Ferreira', 'Confirmado',
   '{"saúde"}', '2026-06-02',
   '{"Presidente":"Nosso candidato","Governador":"Nosso candidato","Senador":"Indeciso","Deputado Federal":"Nosso candidato","Deputado Estadual":"Nosso candidato"}'),
  ('Carlos Eduardo Santos', '(45) 99922-3344', 'Vila Nova', 'Rosa Lima', 'Pendente',
   '{"educação"}', '2026-06-10',
   '{"Presidente":"Outro candidato","Governador":"Indeciso","Senador":"Nosso candidato","Deputado Federal":"Indeciso","Deputado Estadual":"Nosso candidato"}'),
  ('Fernanda Costa', '(45) 99933-4455', 'Bela Vista', 'João Ferreira', 'Confirmado',
   '{"infraestrutura"}', '2026-06-18',
   '{"Presidente":"Nosso candidato","Governador":"Nosso candidato","Senador":"Nosso candidato","Deputado Federal":"Nosso candidato","Deputado Estadual":"Nosso candidato"}'),
  ('Roberto Almeida', '(45) 99944-5566', 'São José', 'Rosa Lima', 'Indeciso',
   '{}', '2026-07-01',
   '{"Presidente":"Indeciso","Governador":"Indeciso","Senador":"Indeciso","Deputado Federal":"Indeciso","Deputado Estadual":"Indeciso"}'),
  ('Juliana Pereira', '(45) 99955-6677', 'Industrial', 'Marcos Souza', 'Confirmado',
   '{"saúde"}', '2026-07-14',
   '{"Presidente":"Nosso candidato","Governador":"Outro candidato","Senador":"Nosso candidato","Deputado Federal":"Nosso candidato","Deputado Estadual":"Nosso candidato"}');

insert into demandas (solicitante, categoria, descricao, bairro, prioridade, status, prazo) values
  ('Marta Aparecida Silva', 'Saúde', 'Falta de médico no posto do Centro', 'Centro', 'Alta', 'Em andamento', '2026-08-15'),
  ('Roberto Almeida', 'Infraestrutura', 'Buraco na rua principal', 'São José', 'Média', 'Nova', '2026-08-20'),
  ('Fernanda Costa', 'Educação', 'Vaga em creche municipal', 'Bela Vista', 'Alta', 'Em análise', '2026-08-10'),
  ('Juliana Pereira', 'Saúde', 'Encaminhamento para especialista', 'Industrial', 'Baixa', 'Resolvida', '2026-07-30');

insert into agenda (titulo, data, hora, local, responsavel) values
  ('Reunião com lideranças do Centro', '2026-08-08', '09:00', 'Sede da campanha', 'João Ferreira'),
  ('Visita ao bairro Vila Nova', '2026-08-08', '14:30', 'Vila Nova', 'Rosa Lima'),
  ('Caminhada Bela Vista', '2026-08-09', '17:00', 'Praça Bela Vista', 'Assessoria'),
  ('Reunião de equipe', '2026-08-10', '10:00', 'Sede da campanha', 'Coordenação');

insert into gastos (descricao, categoria, valor, data, observacoes) values
  ('Impressão de santinhos', 'Material gráfico', 1850, '2026-07-10', 'Lote inicial'),
  ('Combustível carreata Paulista', 'Logística', 620, '2026-07-18', ''),
  ('Faixas de rua', 'Material gráfico', 1957, '2026-07-25', 'Centro e Vila Nova');

insert into material (nome, quantidade_total, quantidade_distribuida, custo_unitario, observacoes) values
  ('Santinhos', 5000, 1200, 0.35, ''),
  ('Faixas de rua', 40, 12, 45, ''),
  ('Adesivos de carro', 2000, 344, 0.5, '');

insert into visitas (pessoa, endereco, data, hora, assessor, assunto, resultado, proximos_passos) values
  ('Marta Aparecida Silva', 'Rua das Palmeiras, 120 - Centro', '2026-08-05', '10:00', 'Paula Nunes', 'Acompanhamento de demanda de saúde', 'Positiva', 'Retornar em 15 dias'),
  ('Roberto Almeida', 'Av. São José, 45', '2026-08-06', '15:30', 'Diego Martins', 'Apresentação de propostas', 'Indeciso', 'Enviar material impresso'),
  ('Fernanda Costa', 'Rua Bela Vista, 88', '2026-08-07', '09:15', 'Paula Nunes', 'Confirmação de apoio', 'Positiva', 'Convidar para caminhada');

insert into eventos (nome, data, hora, local, responsavel, publico_estimado, observacoes) values
  ('Caminhada Bela Vista', '2026-08-09', '17:00', 'Praça Bela Vista', 'Assessoria', 300, 'Confirmar carro de som'),
  ('Encontro com lideranças do Centro', '2026-08-15', '19:00', 'Sede da campanha', 'João Ferreira', 60, ''),
  ('Feira de saúde comunitária', '2026-08-22', '08:00', 'Vila Nova', 'Rosa Lima', 500, 'Parceria com posto de saúde');

insert into tarefas (titulo, responsavel, prazo, prioridade, status) values
  ('Preparar material da caminhada de Bela Vista', 'Paula Nunes', '2026-08-08', 'Alta', 'Em andamento'),
  ('Atualizar planilha de apoiadores do Centro', 'Diego Martins', '2026-08-09', 'Média', 'Pendente'),
  ('Confirmar carro de som para o evento', 'Camila Rocha', '2026-08-08', 'Alta', 'Pendente'),
  ('Fechar prestação de contas da semana', 'Gabriel Souza', '2026-08-10', 'Média', 'Concluída');

insert into metas_votos (cargo, meta) values
  ('Presidente', 5000),
  ('Governador', 4200),
  ('Senador', 3800),
  ('Deputado Federal', 3000),
  ('Deputado Estadual', 2500);

insert into pesquisas (titulo, data, responsavel, opcoes) values
  ('Avaliação da gestão atual', '2026-07-20', 'Equipe de campo',
   '[{"texto":"Ótima/boa","respostas":62},{"texto":"Regular","respostas":41},{"texto":"Ruim/péssima","respostas":27}]'),
  ('Principal problema do bairro', '2026-07-28', 'Equipe de campo',
   '[{"texto":"Saúde","respostas":58},{"texto":"Infraestrutura","respostas":44},{"texto":"Educação","respostas":22},{"texto":"Segurança","respostas":19}]');

insert into documentos (nome, categoria, data, link, observacoes) values
  ('Registro de candidatura', 'Jurídico', '2026-06-15', '', 'Protocolo no cartório eleitoral'),
  ('Prestação de contas - julho', 'Financeiro', '2026-08-01', '', ''),
  ('Roteiro da caminhada Bela Vista', 'Comunicação', '2026-08-05', '', '');
