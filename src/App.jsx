const handleUploadMutiplo = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setLoading(true);

    for (const file of files) {
      // 1. LIMPA O NOME: Remove acentos e caracteres especiais
      const nomeLimpo = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-zA-Z0-9.]/g, "_"); // Troca espaços e símbolos por "_"
      
      const path = `dossie/${Date.now()}_${nomeLimpo}`;
      
      // 2. ENVIA PARA O STORAGE
      const { error: storageError } = await supabase.storage
        .from('processos-ambientais')
        .upload(path, file);

      if (!storageError || storageError.message.includes('already exists')) {
        const { data: urlData } = supabase.storage
          .from('processos-ambientais')
          .getPublicUrl(path);
        
        // 3. GRAVA NO BANCO (CNPJ CAELI)
        await supabase.from('arquivos_processo').insert([{ 
          empresa_cnpj: '38.404.019/0001-76', 
          nome_arquivo: nomeLimpo, 
          url_publica: urlData.publicUrl 
        }]);
      }
    }
    await carregarArquivos();
    setLoading(false);
  };
