import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Tema {
  corPrimaria: string;
  corSecundaria: string;
  corFundo: string;
  corSuperficie: string;
  corTexto: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}

export function useTheme(slug?: string) {
  const [tema, setTema] = useState<Tema | null>(null);
  const [loadingTheme, setLoadingTheme] = useState(true);
  const [errorTheme, setErrorTheme] = useState('');

  useEffect(() => {
    async function loadTheme() {
      try {
        setLoadingTheme(true);
        // Se não for passado um slug explicito, tentamos inferir da URL (útil se usarmos app.com/slug/login ou slug.app.com)
        // Para simplificar, neste MVP se não tiver slug, não carrega (fica com o padrão do index.css)
        let targetSlug = slug;
        
        if (!targetSlug) {
           // Lógica provisória: Pega o primeiro segmento do path se existir (ex: /barbearia-do-ze/login -> barbearia-do-ze)
           const pathParts = window.location.pathname.split('/').filter(Boolean);
           if (pathParts.length > 0 && pathParts[0] !== 'login' && pathParts[0] !== 'dashboard') {
             targetSlug = pathParts[0];
           } else {
             // Retorna silenciosamente, deixando o css root padrão
             setLoadingTheme(false);
             return;
           }
        }

        const response = await api.get(`/temas/empresa/${targetSlug}`);
        const data = response.data;
        setTema(data);

        // Aplica o tema na raiz do documento
        const root = document.documentElement;
        if (data.corPrimaria) root.style.setProperty('--color-primary', data.corPrimaria);
        if (data.corSecundaria) root.style.setProperty('--color-secondary', data.corSecundaria);
        if (data.corFundo) root.style.setProperty('--color-background', data.corFundo);
        if (data.corSuperficie) root.style.setProperty('--color-surface', data.corSuperficie);
        if (data.corTexto) root.style.setProperty('--color-text', data.corTexto);

        // Altera o favicon se houver
        if (data.faviconUrl) {
          let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = data.faviconUrl;
        }

      } catch (err) {
        console.error('Erro ao carregar tema:', err);
        setErrorTheme('Erro ao carregar tema');
      } finally {
        setLoadingTheme(false);
      }
    }

    loadTheme();
  }, [slug]);

  return { tema, loadingTheme, errorTheme };
}
