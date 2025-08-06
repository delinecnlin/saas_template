import React from 'react';
import { render, screen, act } from '@testing-library/react';
import AzureRealtimeChat from '../index';

describe('AzureRealtimeChat transcript bubble', () => {
  test('shows and hides live transcript during speech', () => {
    const ref = React.createRef();
    render(<AzureRealtimeChat ref={ref} />);

    // Initially no transcript bubble
    expect(screen.queryByText('hello')).toBeNull();

    // Simulate transcription delta
    act(() => {
      ref.current.handleTranscriptionDelta('hello');
    });
    const liveBubble = screen.getByText('hello');
    expect(liveBubble).toBeInTheDocument();
    expect(liveBubble).toHaveClass('italic');
    expect(liveBubble.parentElement).toHaveClass('flex');
    expect(liveBubble.parentElement).toHaveClass('justify-end');

    // Complete transcription
    act(() => {
      ref.current.handleTranscriptionComplete();
    });
    const finalBubble = screen.getByText('hello');
    expect(finalBubble).toBeInTheDocument();
    expect(finalBubble).not.toHaveClass('italic');
    // transcript bubble removed, only final message remains
    expect(screen.getAllByText('hello').length).toBe(1);
  });
});
