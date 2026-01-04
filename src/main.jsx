import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// VERSÃO 37 - TESTE DE CONEXÃO
const VERSAO = "MAXIMUS v37.0 - FORÇADO";

const SUPABASE_URL = 'https://gmhxmtlidgcgpstxiiwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Q-5sKvF2zfyl_p1xGe8Uw_4OtvijYs'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  return (
    <div style={{ padding: '50px', backgroundColor: '#000', color: '#ff0', minHeight: '100vh', textAlign: 'center' }}>
      <h1 style={{ fontSize: '40px' }}>{VERSAO}</h1>
      <p style={{ color: '#fff' }}>Se você está lendo isso em PRETO E AMARELO, o Vercel atualizou!</p>
      <div style={{ marginTop: '30px', border: '2px solid #ff0', padding: '20px' }}>
         <p>Tente salvar este código. Assim que o Vercel mostrar "Ready", atualize seu navegador.</p>
      </div>
    </div>
  );
}
