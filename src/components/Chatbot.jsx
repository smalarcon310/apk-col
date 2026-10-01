import React, { useState } from 'react';
import { Bot, RotateCcw, Send, X } from 'lucide-react';
import { mysqlRequest } from '../services/mysqlApi';

const initialMessages = [{
  role: 'model',
  text: 'Hola. Soy el asistente de SERMA. Puedo ayudarte con la metodología FRE, el uso del sistema y, según tu rol, consultar tus datos académicos autorizados.',
}];

const quickQuestions = [
  { label: 'Mis materias y profesores', message: '¿Qué materias tengo y qué profesor dicta cada una?' },
  { label: 'Mi avance general', message: '¿Cuál es mi avance académico general?' },
  { label: 'Avance por materia', message: '¿Cuánto avance llevo en cada materia?' },
  { label: 'Cómo usar SERMA', message: '¿Cómo puedo consultar y actualizar mis avances en SERMA?' },
  { label: 'Metodología FRE', message: '¿Qué es la metodología FRE?' },
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
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
          history: nextMessages.slice(-8).map(({ role, text }) => ({ role, text })),
        },
      });
      setMessages((current) => [...current, { role: 'model', text: response.reply }]);
    } catch (error) {
      setMessages((current) => [...current, {
        role: 'model',
        text: error.message || 'No fue posible conectar con el asistente.',
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
    setMessages(initialMessages);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <section className="mb-3 flex h-[min(620px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" aria-label="Asistente de SERMA">
          <header className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <h2 className="font-semibold">Asistente SERMA</h2>
                <p className="text-xs text-blue-100">FRE y datos académicos autorizados</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={clearConversation} disabled={sending} className="rounded p-1 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Limpiar conversación" title="Limpiar conversación">
                <RotateCcw className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-blue-500" aria-label="Cerrar chatbot">
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
            {sending && <p className="text-sm text-gray-500">El asistente está escribiendo...</p>}
          </div>

          <div className="border-t border-gray-200 bg-white px-3 pt-3">
            <p className="mb-2 text-xs font-medium text-gray-500">Preguntas rápidas</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question) => (
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
              placeholder="Escribe tu pregunta..."
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={2000}
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()} className="rounded-lg bg-blue-600 px-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Enviar mensaje">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
      <button type="button" onClick={() => setOpen((current) => !current)} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700" aria-label={open ? 'Cerrar chatbot' : 'Abrir chatbot'}>
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </div>
  );
}
