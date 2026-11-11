import { useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const getUserId = () => {
  try {
    const persistedUser = localStorage.getItem('user');
    if (persistedUser) {
      const user = JSON.parse(persistedUser);
      if (user && user.id) return `user-${user.id}`;
    }
  } catch {
    // Ignorar parse fallido y continuar con una clave generada.
  }

  const existing = sessionStorage.getItem('mg_user_announcement_id');
  if (existing) return existing;

  const generated = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem('mg_user_announcement_id', generated);
  return generated;
};

const SystemAnnouncementModal = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCurrentAnnouncement = async () => {
      try {
        const response = await fetch(`${API_URL}/api/system/announcement`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });

        if (!response.ok) return;
        const data = await response.json();
        if (data?.active) setAnnouncement(data);
        else setAnnouncement(null);
      } catch {
        // Silenciar errores de red; el flujo SSE se encarga del estado vivo.
      }
    };

    fetchCurrentAnnouncement();

    const source = new EventSource(`${API_URL}/api/system/announcement/stream`);

    source.addEventListener('announcement', (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload?.type === 'clear') {
          setAnnouncement(null);
          return;
        }

        if (payload?.active) {
          setAnnouncement(payload);
          return;
        }

        setAnnouncement(null);
      } catch {
        // Ignorar payload inválido.
      }
    });

    source.onerror = () => {
      // El servidor puede reconectarse solo; el modal no se rompe por eso.
    };

    return () => source.close();
  }, []);

  const myVote = useMemo(() => {
    if (!announcement?.users) return null;
    return announcement.users[getUserId()] || null;
  }, [announcement]);

  const handleVote = async (vote) => {
    if (!announcement?.active || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/system/announcement/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: getUserId(),
          vote,
          comment: vote === 'disagree' ? comment.trim() : '',
        }),
      });

      if (!response.ok) {
        throw new Error('No se pudo registrar la respuesta');
      }

      const data = await response.json();
      setAnnouncement(data?.announcement || null);
      setComment('');
    } catch (error) {
      console.error('Error al votar en la sesión de actualización:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!announcement?.active) return null;

  const isDisagreeVisible = !myVote || myVote === 'disagree';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Aviso del sistema</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">{announcement.title || 'Actualización programada'}</h3>
            </div>
            <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Abierto</div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-slate-700">
            <p className="text-base leading-7 whitespace-pre-line">{announcement.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
            <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200">
              <div className="text-xs uppercase tracking-wide text-emerald-700">Estoy de acuerdo</div>
              <div className="mt-1 text-2xl font-bold text-emerald-600">{announcement.votes?.agree ?? 0}</div>
            </div>
            <div className="rounded-xl bg-rose-50 p-3 border border-rose-200">
              <div className="text-xs uppercase tracking-wide text-rose-700">No estoy de acuerdo</div>
              <div className="mt-1 text-2xl font-bold text-rose-600">{announcement.votes?.disagree ?? 0}</div>
            </div>
          </div>

          {myVote ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Tu respuesta quedó registrada: {myVote === 'agree' ? 'Estoy de acuerdo' : 'No estoy de acuerdo'}.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleVote('agree')}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Estoy de acuerdo
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleVote('disagree')}
                  className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  No estoy de acuerdo
                </button>
              </div>

              {isDisagreeVisible && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Comentario opcional</label>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={4}
                    placeholder="Si no estás de acuerdo o tienes una sugerencia, compártela aquí..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 placeholder:text-slate-400 focus:border-sky-500"
                  />
                </div>
              )}
            </div>
          )}

          {announcement.comments && announcement.comments.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">Sugerencias recibidas</h4>
              <div className="space-y-2">
                {announcement.comments.slice(0, 3).map((item, index) => (
                  <div key={`${item.createdAt}-${index}`} className="rounded-lg bg-white p-2 text-sm text-slate-700 border border-slate-200">
                    {item.comment}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemAnnouncementModal;
