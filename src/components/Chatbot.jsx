import React, { useState } from 'react';
import { Bot, RotateCcw, Send, X } from 'lucide-react';
import { mysqlRequest } from '../services/mysqlApi';

const translations = {
  es: {
    greeting: 'Hola. Soy el asistente de SERMA. Puedo ayudarte con la metodología FRE, el uso del sistema y, según tu rol, consultar tus datos académicos autorizados.',
    quick: [
      { label: 'Mis materias y profesores', message: '¿Qué materias tengo y qué profesor dicta cada una?' },
      { label: 'Mi avance general', message: '¿Cuál es mi avance académico general?' },
      { label: 'Avance por materia', message: '¿Cuánto avance llevo en cada materia?' },
      { label: 'Cómo usar SERMA', message: '¿Cómo puedo consultar y actualizar mis avances en SERMA?' },
      { label: 'Metodología FRE', message: '¿Qué es la metodología FRE?' },
      { label: 'Declaración persona transhumana', message: '¿Qué propone la Declaración Persona Transhumana?' },
    ],
    title: 'Asistente SERMA',
    subtitle: 'FRE y datos académicos autorizados',
    clear: 'Limpiar conversación',
    close: 'Cerrar chatbot',
    openLabel: 'Abrir chatbot',
    typing: 'El asistente está escribiendo...',
    quickTitle: 'Preguntas rápidas',
    placeholder: 'Escribe tu pregunta...',
    send: 'Enviar mensaje',
    error: 'No fue posible conectar con el asistente.',
    language: 'Idioma',
  },
  en: {
    greeting: "Hi! I'm the SERMA assistant. I can help you with the FRE methodology, how to use the system and, depending on your role, look up your authorized academic data.",
    quick: [
      { label: 'My subjects and teachers', message: 'Which subjects do I have and who teaches each one?' },
      { label: 'My overall progress', message: 'What is my overall academic progress?' },
      { label: 'Progress by subject', message: 'How much progress do I have in each subject?' },
      { label: 'How to use SERMA', message: 'How can I view and update my progress in SERMA?' },
      { label: 'FRE methodology', message: 'What is the FRE methodology?' },
      { label: 'Transhuman Person Declaration', message: 'What does the Declaración Persona Transhumana propose?' },
    ],
    title: 'SERMA Assistant',
    subtitle: 'FRE and authorized academic data',
    clear: 'Clear conversation',
    close: 'Close chatbot',
    openLabel: 'Open chatbot',
    typing: 'The assistant is typing...',
    quickTitle: 'Quick questions',
    placeholder: 'Type your question...',
    send: 'Send message',
    error: 'Could not connect to the assistant.',
    language: 'Language',
  },
};

const greetingMessages = (lang) => [{ role: 'model', text: translations[lang].greeting }];
export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState(() => (localStorage.getItem('chatbotLanguage') === 'en' ? 'en' : 'es'));
  const [messages, setMessages] = useState(() => greetingMessages(language));
  const t = translations[language];
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const sendQuestion = async (message) => {
    if (!message || sending) return;

    const nextMessages = [...messages, { role: 'user', text: message }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    try {
      const response = await mysqlRequest('/api/chat', {
        method: 'POST',
        body: {
          message,
          language,
          history: nextMessages.slice(-8).map(({ role, text }) => ({ role, text })),
        },
      });
      setMessages((current) => [...current, { role: 'model', text: response.reply }]);
    } catch (error) {
      setMessages((current) => [...current, {
        role: 'model',
        text: error.message || t.error,
      }]);
    } finally {
      setSending(false);
    }
  };

  const sendMessage = (event) => {
    event.preventDefault();
    sendQuestion(input.trim());
  };

  const clearConversation = () => {
    if (sending) return;
    setMessages(greetingMessages(language));
  };

  const changeLanguage = (next) => {
    if (next === language) return;
    setLanguage(next);
    localStorage.setItem('chatbotLanguage', next);
    setMessages((current) => (current.length === 1 ? greetingMessages(next) : current));
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <section className="mb-3 flex h-[min(620px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" aria-label={t.title}>
          <header className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <h2 className="font-semibold">{t.title}</h2>
                <p className="text-xs text-blue-100">{t.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="mr-1 flex overflow-hidden rounded border border-blue-300 text-xs font-semibold" role="group" aria-label={t.language}>
                {['es', 'en'].map((code) => (
                  <button key={code} type="button" onClick={() => changeLanguage(code)} aria-pressed={language === code} className={`px-2 py-0.5 ${language === code ? 'bg-white text-blue-700' : 'hover:bg-blue-500'}`}>
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
              <button type="button" onClick={clearConversation} disabled={sending} className="rounded p-1 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50" aria-label={t.clear} title={t.clear}>
                <RotateCcw className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-blue-500" aria-label={t.close}>
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-3" aria-live="polite">
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${item.role === 'user' ? 'rounded-br-sm bg-blue-600 text-white' : 'rounded-bl-sm bg-white text-gray-800 shadow-sm'}`}>
                  {item.text}
                </p>
              </div>
            ))}
            {sending && <p className="text-sm text-gray-500">{t.typing}</p>}
          </div>

          <div className="border-t border-gray-200 bg-white px-3 pt-3">
            <p className="mb-2 text-xs font-medium text-gray-500">{t.quickTitle}</p>
            <div className="flex flex-wrap gap-2">
              {t.quick.map((question) => (
                <button
                  key={question.label}
                  type="button"
                  onClick={() => sendQuestion(question.message)}
                  disabled={sending}
                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-left text-xs text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {question.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-gray-200 bg-white p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.placeholder}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={2000}
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()} className="rounded-lg bg-blue-600 px-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" aria-label={t.send}>
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
      <button type="button" onClick={() => setOpen((current) => !current)} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700" aria-label={open ? t.close : t.openLabel}>
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </div>
  );
}
