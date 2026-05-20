import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

const AGENT_URL = 'https://ziro.zirox.io/api/chat';

const TRIADAK_CONTEXT = `Eres el asistente de soporte de Triadak (triadak.io), una plataforma SaaS de gestión de alojamientos vacacionales desarrollada por Ziro (zirox.io). Responde siempre en el idioma del usuario. Sé conciso y útil. Si no sabes algo específico de la cuenta del usuario, indícale que contacte a Ziro en ziro@zirox.io.

## Triadak — Contexto del producto

Triadak combina gestión de propiedades, reservas, CRM, finanzas, personal operativo y comunicación en una sola herramienta. Stack: React + Vite + TypeScript + Tailwind · NestJS + Supabase.

Módulos disponibles: Dashboard (analytics), Propiedades (CRUD + imágenes + códigos WiFi), Reservas (calendario visual), Propietarios (portal dedicado), CRM, Finanzas (P&L + PDF/CSV), Personal (limpiadores/mantenimiento + nómina + checklist), Canales (iCal sync con Airbnb/Booking/Lodgify), Ocupación (Gantt), Mensajería (WhatsApp + SMS, 6 plantillas automáticas), Contratos (PDF + firma digital), Revenue (precios dinámicos), Benchmarking, Auditoría, Backup, Portal huésped (/guest/:token), Portal propietario (/portal/dashboard), Portal operativo (/worker/tasks).

Roles: admin (primer usuario, acceso total), staff (dashboard completo), owner (portal propietario — email coincide con tabla owners), worker (portal operativo — email coincide con staff_members).

## Cliente real: Hidden Exclusive Retreats (Suiza)

Web: hiddenretreats.online · Email: info@hiddenretreats.online · WhatsApp: +41 77 259 20 60 · Instagram: @hidden_exclusive_retreats
Empresa de chalets de lujo en los Alpes suizos (Oberland Bernés). Concepto: "Home Feeling. Hotel Experience". 22 propiedades, CHF 68–605/noche.

Propiedades (nombre | huéspedes | CHF/noche | código):
Grand Lookout Boutique Chalet | 18 | 605 | —
The MountainHut Chalet | 10-12 | 398 | 1213
The Alpine Edge | 4 | 295 | —
The AlpGallery | 6 | 295 | 1730
The 1466 EDITION | 6 | 290 | 2830
The Lohner Retreat | 6 | 260 | 3049
The Niesen Retreat | 5 | 250 | 2362
The GlacierDoor Retreat | 8 | 195 | 5052
The GreenAlley | 4 | 188 | 1730
The Seehof *1 | 4 | 170 | 3800
The Eiger Retreat | 4 | 160 | 3967
The Snowpeak @Lookout | 6 | 158 | 2442/3443
The ROOF Edition | 6 | 155 | —
The Blausee Retreat | 4 | 155 | 3032
The AlpStyle Retreat | 4 | 155 | 4042
The Seehof *2 | 2-4 | 150 | 3600
The AlpVillage | 7 | 140 | 2422
The Valley Retreat | 6 | 138 | 2025
The Stockhorn | 3 | 68 | 3778
The Gehrihorn | 4 | 98 | 4046
The Balmhorn | 4 | 98 | 9047
The Signature @Lookout | 6 | 178 | 1441

Servicios incluidos: check-in sin contacto, limpieza profesional, cocinas equipadas, camas premium, streaming, conserjería online. Select properties: sala de juegos, gimnasio, spa.

## FAQs

Personal de limpieza: se registran con el email que tienen en /staff → el sistema los redirige a /worker/tasks con sus tareas del día.
Propietarios: se registran con el email de la tabla owners → acceden a /portal/dashboard con reservas e informes descargables.
Sync Airbnb/Booking: iCal en /channels, deduplicación automática.
WhatsApp automático: 6 plantillas en /messaging (confirmación, check-in, instrucciones, check-out, portal huésped, agradecimiento).
App móvil: Triadak es web app responsive, sin instalación.
Reporte de daño: desde Worker Portal crean tarea tipo maintenance → admin recibe notificación.
Informe mensual propietario: /statements → seleccionar owner y mes → descargar PDF o CSV.
Idiomas: español, inglés, alemán, francés (Settings → Preferencias).`;

type Msg = { text: string; from: 'user' | 'bot' };

export default function ChatWidget() {
    const [open, setOpen]       = useState(false);
    const [msgs, setMsgs]       = useState<Msg[]>([
        { text: '👋 ¡Hola! Soy el asistente de Triadak. ¿En qué puedo ayudarte?', from: 'bot' },
    ]);
    const [input, setInput]     = useState('');
    const [loading, setLoading] = useState(false);
    const chatIdRef             = useRef(`triadak-${Math.random().toString(36).slice(2)}`);
    const bottomRef             = useRef<HTMLDivElement>(null);
    const inputRef              = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [msgs, loading]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 200);
    }, [open]);

    const send = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;
        setInput('');
        setMsgs(prev => [...prev, { text: trimmed, from: 'user' }]);
        setLoading(true);

        try {
            const isFirst = msgs.length === 1;
            const payload = isFirst
                ? `[CONTEXTO DEL SISTEMA: ${TRIADAK_CONTEXT}]\n\nUsuario: ${trimmed}`
                : trimmed;

            const res = await fetch(AGENT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: payload, chatId: chatIdRef.current }),
            });
            const data = await res.json();
            const reply = data.reply ?? 'Lo siento, hubo un error. Inténtalo de nuevo.';
            setMsgs(prev => [...prev, { text: reply, from: 'bot' }]);
        } catch {
            setMsgs(prev => [...prev, { text: 'Error de conexión. Verifica tu internet e inténtalo de nuevo.', from: 'bot' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Bubble button */}
            <button
                onClick={() => setOpen(v => !v)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-indigo-500/50"
                aria-label="Abrir chat"
            >
                {open
                    ? <X className="h-6 w-6 text-white" />
                    : <MessageSquare className="h-6 w-6 text-white" />
                }
            </button>

            {/* Chat panel */}
            <div className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col transition-all duration-300 origin-bottom-right ${open ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'}`}
                style={{ height: 480 }}
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-white/[0.02] rounded-t-2xl">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Asistente Triadak</p>
                        <p className="text-xs text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                            En línea
                        </p>
                    </div>
                    <button onClick={() => setOpen(false)} className="ml-auto text-slate-500 hover:text-white transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                    {msgs.map((msg, i) => (
                        <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                msg.from === 'user'
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm'
                                    : 'bg-white/5 border border-white/8 text-slate-200 rounded-bl-sm'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white/5 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                                {[0, 0.2, 0.4].map((d, i) => (
                                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                                        style={{ animation: `bounce 1.2s ease-in-out ${d}s infinite` }} />
                                ))}
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-3 py-3 border-t border-white/5 flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && send(input)}
                        placeholder="Escribe tu mensaje..."
                        disabled={loading}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
                    />
                    <button
                        onClick={() => send(input)}
                        disabled={loading || !input.trim()}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:opacity-90 transition-opacity"
                    >
                        <Send className="h-4 w-4 text-white" />
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
            `}</style>
        </>
    );
}
