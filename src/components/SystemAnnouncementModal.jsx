import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const getCurrentUser = () => {
  try {
    const persistedUser = localStorage.getItem('user');
    if (persistedUser) {
      return JSON.parse(persistedUser);
    }
  } catch {
    // Ignorar parse fallido y continuar con una clave generada.
  }

  return null;
};

const getUserId = () => {
  const user = getCurrentUser();
  if (user && user.id) return `user-${user.id}`;

  const existing = sessionStorage.getItem('mg_user_announcement_id');
  if (existing) return existing;

  const generated = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem('mg_user_announcement_id', generated);
  return generated;
};

const getUserDisplayName = () => {
  const user = getCurrentUser();
  if (!user) return 'Usuario anónimo';
  const nombreCompleto = [user.nombre, user.apellido].filter(Boolean).join(' ').trim();
  return nombreCompleto || user.email || `Usuario ${user.id || 'sin id'}`;
};

const getAnnouncementUserActionKey = (userId, announcementId) => `mg_announcement_user_action_${userId}_${announcementId || 'current'}`;

const getAnnouncementDismissKey = (announcementId, userId = getUserId()) => `mg_announcement_dismissed_${userId}_${announcementId || 'current'}`;

const isUserAuthenticated = () => {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) return false;
    const parsed = JSON.parse(user);
    return Boolean(parsed && parsed.id);
  } catch {
    return false;
  }
};

const SystemAnnouncementModal = () => {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isUserAuthenticated()) {
      setAnnouncement(null);
      setIsDismissed(false);
      return undefined;
    }

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
        const userId = getUserId();
        const actionKey = data?.startedAt ? getAnnouncementUserActionKey(userId, data.startedAt) : null;
        const dismissed = data?.startedAt ? localStorage.getItem(getAnnouncementDismissKey(data.startedAt, userId)) : null;
        if (data?.active && !dismissed && !actionKey) {
          setAnnouncement(data);
        } else if (data?.active && !dismissed && actionKey) {
          const hasUserAction = localStorage.getItem(actionKey);
          if (!hasUserAction) setAnnouncement(data);
          else setAnnouncement(null);
        } else {
          setAnnouncement(null);
        }
      } catch {
        // Silenciar errores de red; el flujo SSE se encarga del estado vivo.
      }
    };

    fetchCurrentAnnouncement();

    const source = new EventSource(`${API_URL}/api/system/announcement/stream`);

    source.onopen = () => {
      fetchCurrentAnnouncement();
    };

    source.addEventListener('announcement', (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload?.type === 'clear') {
          setAnnouncement(null);
          setIsDismissed(false);
          return;
        }

        if (payload?.active) {
          const userId = getUserId();
          const actionKey = payload?.startedAt ? getAnnouncementUserActionKey(userId, payload.startedAt) : null;
          const dismissed = payload?.startedAt ? localStorage.getItem(getAnnouncementDismissKey(payload.startedAt, userId)) : null;
          const hasUserAction = actionKey ? localStorage.getItem(actionKey) : null;

          if (dismissed || hasUserAction) {
            setAnnouncement(null);
            return;
          }

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
  }, [location.pathname]);

  const myVote = useMemo(() => {
    if (!announcement?.users) return null;
    return announcement.users[getUserId()] || null;
  }, [announcement]);

  const handleDismiss = async () => {
    try {
      await fetch(`${API_URL}/api/system/announcement/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getUserId(),
          userName: getUserDisplayName(),
          action: 'read',
          comment: 'Cerró el aviso sin abrir el detalle',
        }),
      });
    } catch {
      // Ignorar fallo del registro del cierre; el flujo visual debe seguir funcionando.
    }

    if (announcement?.startedAt) {
      const userId = getUserId();
      localStorage.setItem(getAnnouncementUserActionKey(userId, announcement.startedAt), 'read');
      localStorage.setItem(getAnnouncementDismissKey(announcement.startedAt, userId), '1');
    }
    setIsDismissed(true);
    setAnnouncement(null);
  };

  const handleVote = async (vote) => {
    if (!announcement?.active || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const userId = getUserId();
      const response = await fetch(`${API_URL}/api/system/announcement/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userName: getUserDisplayName(),
          vote,
          comment: vote === 'disagree' ? comment.trim() : '',
        }),
      });

      if (announcement?.startedAt) {
        localStorage.setItem(getAnnouncementUserActionKey(userId, announcement.startedAt), vote);
      }

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

  if (!isUserAuthenticated() || !announcement?.active || isDismissed) return null;

  const isDisagreeVisible = !myVote || myVote === 'disagree';

  return (
    <div className="fixed inset-x-0 top-4 z-[2147483647] flex justify-center px-3">
      <div className="w-full max-w-xl rounded-xl border border-amber-200 bg-white shadow-xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-amber-50 px-4 py-2.5">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-amber-700">Aviso del sistema</p>
            <h3 className="mt-1 text-base font-bold text-slate-900 line-clamp-2">{announcement.title || 'Actualización programada'}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:border-slate-400"
            >
              {isExpanded ? 'Ver menos' : 'Ver aviso'}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:border-slate-400"
            >
              Cerrar aviso
            </button>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-slate-700">
            <p className="leading-5 whitespace-pre-line line-clamp-3">{announcement.message}</p>
          </div>

          {isExpanded && (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
              <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200">
                <div className="text-[10px] uppercase tracking-wide text-emerald-700">Estoy de acuerdo</div>
                <div className="mt-1 text-2xl font-bold text-emerald-600">{announcement.votes?.agree ?? 0}</div>
              </div>
              <div className="rounded-xl bg-rose-50 p-3 border border-rose-200">
                <div className="text-[10px] uppercase tracking-wide text-rose-700">No estoy de acuerdo</div>
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
                      rows={3}
                      placeholder="Si no estás de acuerdo o tienes una sugerencia, compártela aquí..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 placeholder:text-slate-400 focus:border-sky-500"
                    />
                  </div>
                )}
              </div>
            )}

              {announcement.comments && announcement.comments.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <h4 className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700">Sugerencias recibidas</h4>
                  <div className="space-y-2">
                    {announcement.comments.slice(0, 3).map((item, index) => (
                      <div key={`${item.createdAt}-${index}`} className="rounded-lg bg-white p-2 text-sm text-slate-700 border border-slate-200">
                        {item.comment}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemAnnouncementModal;
