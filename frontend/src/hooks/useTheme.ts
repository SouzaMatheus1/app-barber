import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Tema {
  corPrimaria: string;
  corSecundaria: string;
  corFundo: string;
  corSuperficie: string;
  corTexto: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}

export function useTheme(slugProp?: string) {
  const { user } = useAuth();
  const location = useLocation();
  const [tema, setTema] = useState<Tema | null>(null);
  const [loadingTheme, setLoadingTheme] = useState(true);

  useEffect(() => {
    async function loadTheme() {
      try {
        setLoadingTheme(true);

        const queryParams = new URLSearchParams(window.location.search);
        const slugQuery = queryParams.get('slug') || queryParams.get('company');
        
        const pathParts = location.pathname.split('/').filter(Boolean);
        const slugPath = pathParts.length > 0 && !['login', 'dashboard', 'clientes', 'profissionais', 'transacoes', 'catalogo', 'assinaturas', 'comissoes'].includes(pathParts[0]) 
          ? pathParts[0] 
          : null;

        const targetSlug = slugProp || slugQuery || user?.slug || slugPath;

        if (!targetSlug) {
          setLoadingTheme(false);
          return;
        }

        const response = await api.get(`/temas/empresa/${targetSlug}`);
        const data = response.data;
        setTema(data);

        const root = document.documentElement;
        if (data.corPrimaria) root.style.setProperty('--color-primary', data.corPrimaria);
        if (data.corSecundaria) root.style.setProperty('--color-secondary', data.corSecundaria);
        if (data.corFundo) root.style.setProperty('--color-background', data.corFundo);
        if (data.corSuperficie) root.style.setProperty('--color-surface', data.corSuperficie);
        if (data.corTexto) root.style.setProperty('--color-text', data.corTexto);

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
        console.error('Erro ao carregar tema dinâmico:', err);
      } finally {
        setLoadingTheme(false);
      }
    }

    loadTheme();
  }, [slugProp, user?.slug, location.pathname]);

  return { tema, loadingTheme };
}
