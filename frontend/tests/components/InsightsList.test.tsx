import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InsightsList from '../../src/components/InsightsList';

const mockInsights = [
  {
    id: '1',
    title: 'High Drop-off at Checkout',
    summary: '60% of users abandon the checkout process',
    priority: 'high' as const,
    category: 'conversion',
    status: 'new',
    metrics: { affectedUsers: 600 }
  },
  {
    id: '2',
    title: 'Underused Export Feature',
    summary: 'Only 5% of users discover the export functionality',
    priority: 'medium' as const,
    category: 'engagement',
    status: 'new',
    metrics: { affectedUsers: 50 }
  }
];

describe('InsightsList', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('should render insights list', () => {
    renderWithRouter(<InsightsList insights={mockInsights} />);
    
    expect(screen.getByText('High Drop-off at Checkout')).toBeInTheDocument();
    expect(screen.getByText('Underused Export Feature')).toBeInTheDocument();
  });

  it('should display empty state when no insights', () => {
    renderWithRouter(<InsightsList insights={[]} />);
    
    expect(screen.getByText(/No insights available/)).toBeInTheDocument();
  });

  it('should show priority badges with correct styling', () => {
    renderWithRouter(<InsightsList insights={mockInsights} />);
    
    const highPriority = screen.getByText('high');
    const mediumPriority = screen.getByText('medium');
    
    expect(highPriority.parentElement).toHaveClass('high');
    expect(mediumPriority.parentElement).toHaveClass('medium');
  });

  it('should display affected users metric', () => {
    renderWithRouter(<InsightsList insights={mockInsights} />);
    
    expect(screen.getByText('600 users affected')).toBeInTheDocument();
    expect(screen.getByText('50 users affected')).toBeInTheDocument();
  });

  it('should display category tags', () => {
    renderWithRouter(<InsightsList insights={mockInsights} />);
    
    expect(screen.getByText('conversion')).toBeInTheDocument();
    expect(screen.getByText('engagement')).toBeInTheDocument();
  });

  it('should navigate to insight detail when clicked without onSelect', () => {
    renderWithRouter(<InsightsList insights={mockInsights} />);
    
    const firstInsight = screen.getByText('High Drop-off at Checkout').closest('a');
    expect(firstInsight).toHaveAttribute('href', '/insights?id=1');
  });

  it('should call onSelect when provided', () => {
    const mockOnSelect = jest.fn();
    renderWithRouter(<InsightsList insights={mockInsights} onSelect={mockOnSelect} />);
    
    const firstInsight = screen.getByText('High Drop-off at Checkout').closest('div');
    fireEvent.click(firstInsight!);
    
    expect(mockOnSelect).toHaveBeenCalledWith('1');
  });

  it('should render as div when onSelect is provided', () => {
    const mockOnSelect = jest.fn();
    renderWithRouter(<InsightsList insights={mockInsights} onSelect={mockOnSelect} />);
    
    const items = screen.getAllByText(/Drop-off|Export/);
    items.forEach(item => {
      const wrapper = item.closest('div.insightItem');
      expect(wrapper?.tagName).toBe('DIV');
    });
  });
});