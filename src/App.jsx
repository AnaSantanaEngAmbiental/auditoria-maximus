-- ============================================================
-- PROTOCOLO MAXIMUS PhD v18.0 - RECONSTRUÇÃO SEGURA
-- ============================================================

-- 1. LIMPEZA CIRÚRGICA (Na ordem correta para evitar erros)
-- Primeiro removemos os arquivos físicos para liberar o bucket
DELETE FROM storage.objects WHERE bucket_id = 'evidencias';

-- Agora podemos remover as tabelas e o bucket sem erro
DROP TABLE IF EXISTS documentos_processados CASCADE;
DROP TABLE IF EXISTS unidades_maximus CASCADE;
DELETE FROM storage.buckets WHERE id = 'evidencias';

-- 2. TABELA DE UNIDADES (EMPRESAS)
CREATE TABLE unidades_maximus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    razao_social TEXT NOT NULL,
    cnpj TEXT UNIQUE NOT NULL,
    atividade_principal TEXT DEFAULT 'Transporte',
    municipio TEXT DEFAULT 'Marabá/PA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE DOCUMENTOS (COM TRAVA ANTI-DUPLICIDADE)
CREATE TABLE documentos_processados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unidade_id UUID REFERENCES unidades_maximus(id) ON DELETE CASCADE,
    nome_arquivo TEXT NOT NULL,
    url_foto TEXT,
    tipo_doc TEXT, 
    conteudo_extraido JSONB DEFAULT '{}'::jsonb,
    status_conformidade TEXT DEFAULT 'AUDITADO',
    data_leitura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- ESTA LINHA IMPEDE DUPLICIDADE:
    CONSTRAINT unique_arquivo_por_unidade UNIQUE (unidade_id, nome_arquivo)
);

-- 4. INSERIR A UNIDADE PILOTO (CARDOSO & RATES)
INSERT INTO unidades_maximus (id, razao_social, cnpj, atividade_principal) 
VALUES ('8694084d-26a9-4674-848e-67ee5e1ba4d4', 'CARDOSO & RATES TRANSPORTE', '38.404.019/0001-76', 'Transporte de Carga');

-- 5. CONFIGURAR STORAGE (BUCKET)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('evidencias', 'evidencias', true, 52428800, '{image/*, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet}');

-- 6. PERMISSÕES DE SEGURANÇA (RLS)
-- Liberamos tudo para evitar bloqueios no Front-end
ALTER TABLE unidades_maximus DISABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_processados DISABLE ROW LEVEL SECURITY;

-- Política de Storage (Apaga a antiga se existir e cria a nova)
DROP POLICY IF EXISTS "Acesso Total Maximus" ON storage.objects;
CREATE POLICY "Acesso Total Maximus" ON storage.objects FOR ALL USING (bucket_id = 'evidencias') WITH CHECK (bucket_id = 'evidencias');
