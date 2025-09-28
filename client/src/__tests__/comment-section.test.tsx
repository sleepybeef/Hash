import { render, screen, fireEvent } from '@testing-library/react';
import CommentSection from '../components/comment-section';

describe('CommentSection', () => {
  it('renders comments and posts a new comment', async () => {
    render(<CommentSection videoId="test-video" likeCount={0} viewCount={0} onLike={() => {}} />);
    expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Add a comment/i), { target: { value: 'Test comment' } });
    fireEvent.click(screen.getByText(/Post/i));
    // Add more assertions for API call and UI update
  });
});
