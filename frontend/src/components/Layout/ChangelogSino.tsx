import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { changelogService } from '../../services/ChangelogService';
import type { ChangelogEntry } from '../../services/ChangelogService';

dayjs.extend(relativeTime);

const ChangelogSino = () => {
  const [naoLidas, setNaoLidas] = useState(0);
  const [aberto, setAberto] = useState(false);
  const [entradas, setEntradas] = useState<ChangelogEntry[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    changelogService.contarNaoLidas()
      .then(({ total }) => setNaoLidas(total))
      .catch(() => {});
  }, []);

  const abrirPainel = async () => {
    setAberto(true);
    setCarregando(true);
    try {
      const lista = await changelogService.listar();
      setEntradas(lista);
      await changelogService.marcarVisualizado();
      setNaoLidas(0);
    } catch {
      // silencioso: painel de changelog não é crítico para o uso do sistema
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={abrirPainel}
        className="relative text-[var(--color-text)]/80 hover:text-[var(--color-primary)] transition-colors"
        aria-label="Novidades do sistema"
      >
        <Bell size={20} />
        {naoLidas > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] border border-[var(--color-primary)]/30 rounded-xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="absolute top-4 right-4 text-[var(--color-text)]/50 hover:text-[var(--color-text)]"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6 flex items-center gap-2">
              <Bell size={20} /> Novidades
            </h2>

            {carregando && (
              <p className="text-[var(--color-text)]/70">Carregando...</p>
            )}

            {!carregando && entradas.length === 0 && (
              <p className="text-[var(--color-text)]/70">Nenhuma novidade por aqui ainda.</p>
            )}

            {!carregando && entradas.length > 0 && (
              <div className="space-y-4">
                {entradas.map((entrada) => (
                  <div
                    key={entrada.id}
                    className="border-b border-[var(--color-primary)]/10 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-semibold text-[var(--color-text)]">{entrada.titulo}</h3>
                      <span className="text-xs text-[var(--color-text)]/50 whitespace-nowrap">
                        {dayjs(entrada.publicadoEm).locale('pt-br').fromNow()}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text)]/80 mt-1 whitespace-pre-wrap">{entrada.descricao}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChangelogSino;
