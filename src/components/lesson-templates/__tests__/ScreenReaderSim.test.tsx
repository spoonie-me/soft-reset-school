import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScreenReaderSim, type ScreenReaderSimProps } from '../ScreenReaderSim';

const props: ScreenReaderSimProps = {
  title: 'Tab through a simulated screen reader',
  intro: 'Press Tab.',
  note: 'This is a simulation.',
  controls: [
    { id: 'a', visual: 'Remember me', code: '<label><input type="checkbox"> Remember me</label>', announces: 'Remember me, checkbox, not checked', named: true },
    { id: 'b', visual: 'Subscribe', code: '<input type="checkbox" id="s">', announces: 'checkbox, not checked', named: false },
  ],
  debrief: 'One of them told you nothing.',
};

const out = () => screen.getByRole('log', { name: 'Simulated screen reader output' });

describe('ScreenReaderSim', () => {
  it('starts with a prompt and announces each control on Tab', async () => {
    const user = userEvent.setup();
    render(<ScreenReaderSim {...props} />);
    expect(out()).toHaveTextContent('Press Tab to move to the first control.');
    await user.click(screen.getByRole('button', { name: /Tab \(next control\)/ }));
    expect(out()).toHaveTextContent('Remember me, checkbox, not checked');
    await user.click(screen.getByRole('button', { name: /Tab \(next control\)/ }));
    expect(out()).toHaveTextContent(/^.*Remember me, checkbox, not checked.*checkbox, not checked$/s);
  });

  it('flips the state on Space and announces it', async () => {
    const user = userEvent.setup();
    render(<ScreenReaderSim {...props} />);
    const space = screen.getByRole('button', { name: /Space/ });
    expect(space).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Tab \(next control\)/ }));
    expect(space).toBeEnabled();
    await user.click(space);
    expect(out()).toHaveTextContent('Remember me, checkbox, checked');
  });

  it('shows the debrief only after every control has been visited, in words not colour', async () => {
    const user = userEvent.setup();
    render(<ScreenReaderSim {...props} />);
    const tab = screen.getByRole('button', { name: /Tab \(next control\)/ });
    await user.click(tab);
    expect(screen.queryByText('What you just heard')).not.toBeInTheDocument();
    await user.click(tab);
    expect(screen.getByText('What you just heard')).toBeInTheDocument();
    expect(screen.getByText('Remember me: a name was announced')).toBeInTheDocument();
    expect(screen.getByText('Subscribe: no name was announced')).toBeInTheDocument();
    expect(screen.getByText('One of them told you nothing.')).toBeInTheDocument();
  });

  it('says so at the ends of the form and lets you start again', async () => {
    const user = userEvent.setup();
    render(<ScreenReaderSim {...props} />);
    const tab = screen.getByRole('button', { name: /Tab \(next control\)/ });
    await user.click(tab);
    await user.click(tab);
    await user.click(tab);
    expect(out()).toHaveTextContent('End of form.');
    await user.click(screen.getByRole('button', { name: 'Start again' }));
    expect(out()).toHaveTextContent('Press Tab to move to the first control.');
    expect(screen.queryByText('What you just heard')).not.toBeInTheDocument();
  });

  it('never takes over the keyboard: every control is a real button', () => {
    render(<ScreenReaderSim {...props} />);
    for (const b of screen.getAllByRole('button')) expect(b).toHaveProperty('tagName', 'BUTTON');
  });
});
