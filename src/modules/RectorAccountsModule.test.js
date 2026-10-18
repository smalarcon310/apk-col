import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RectorAccountsModule from './RectorAccountsModule';
import { createRector } from '../services/rectorService';

jest.mock('../services/rectorService', () => ({
  createRector: jest.fn(),
}));

test('creates a rector account using the entered profile details', async () => {
  createRector.mockResolvedValue({});
  render(<RectorAccountsModule />);

  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Rosa' } });
  fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'Rectores' } });
  fireEvent.change(screen.getByLabelText('Cédula'), { target: { value: '1234567890' } });
  fireEvent.change(screen.getByLabelText('Celular'), { target: { value: '3001234567' } });
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'rectora@example.com' } });
  fireEvent.change(screen.getByLabelText(/contraseña \(mínimo 8 caracteres\)/i), {
    target: { value: 'temporal-segura' },
  });
  fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
    target: { value: 'temporal-segura' },
  });

  fireEvent.click(screen.getByRole('button', { name: 'Crear rector' }));

  await waitFor(() => {
    expect(createRector).toHaveBeenCalledWith({
      firstName: 'Rosa',
      lastName: 'Rectores',
      documentId: '1234567890',
      email: 'rectora@example.com',
      phone: '3001234567',
      password: 'temporal-segura',
    });
  });
  expect(await screen.findByRole('status')).toHaveTextContent(/cuenta de rector creada correctamente/i);
});
