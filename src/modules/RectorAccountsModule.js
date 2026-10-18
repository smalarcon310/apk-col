import React, { useState } from 'react';
import { createRector } from '../services/rectorService';

const initialForm = {
  firstName: '',
  lastName: '',
  documentId: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

export const RectorAccountsModule = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await createRector({
        firstName: form.firstName,
        lastName: form.lastName,
        documentId: form.documentId,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      setForm(initialForm);
      setMessage('Cuenta de rector creada correctamente. Ya puede iniciar sesión.');
    } catch (requestError) {
      setError(requestError.message || 'No se pudo crear la cuenta de rector');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-2">Crear cuenta de rector</h2>
      <p className="text-sm text-gray-600 mb-5">
        La cuenta podrá ingresar al panel con el correo y la contraseña definidos aquí.
      </p>

      {message && (
        <div role="status" className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm text-gray-700">
            Nombre
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              autoComplete="given-name"
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Apellido
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              autoComplete="family-name"
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Cédula
            <input
              name="documentId"
              value={form.documentId}
              onChange={handleChange}
              autoComplete="off"
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Celular
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700 sm:col-span-2">
            Correo electrónico
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Contraseña (mínimo 8 caracteres)
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Confirmar contraseña
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creando cuenta...' : 'Crear rector'}
        </button>
      </form>
    </section>
  );
};

export default RectorAccountsModule;
