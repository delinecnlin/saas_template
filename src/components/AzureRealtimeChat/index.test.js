import { render, screen } from '@testing-library/react';
import AzureRealtimeChat from './index';

describe('AzureRealtimeChat', () => {
  it('renders speaker labels for user and assistant messages', () => {
    render(
      <AzureRealtimeChat
        initialMessages={[
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Hello there' }
        ]}
      />
    );

    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getAllByText('Assistant')[0]).toBeInTheDocument();
  });

  it('renders streaming response with assistant label', () => {
    render(<AzureRealtimeChat initialResponse="Typing..." />);
    expect(screen.getByText('Assistant')).toBeInTheDocument();
    expect(screen.getByText('Typing...')).toBeInTheDocument();
  });
});
