import { render, screen } from '@testing-library/react';
import StatsCard from '../../src/components/StatsCard';

describe('StatsCard', () => {
  it('should render title and value', () => {
    render(<StatsCard title="Total Users" value={1234} />);
    
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('should display string values', () => {
    render(<StatsCard title="Status" value="Active" />);
    
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should show positive trend', () => {
    render(<StatsCard title="Growth" value={100} trend={15} />);
    
    expect(screen.getByText('+15%')).toBeInTheDocument();
  });

  it('should show negative trend', () => {
    render(<StatsCard title="Drop-off" value={50} trend={-10} />);
    
    expect(screen.getByText('-10%')).toBeInTheDocument();
  });

  it('should not show trend when zero', () => {
    render(<StatsCard title="Stable" value={75} trend={0} />);
    
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  it('should apply correct type styling', () => {
    const { container } = render(
      <StatsCard title="Error Rate" value={25} type="error" />
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('error');
  });

  it('should apply neutral styling by default', () => {
    const { container } = render(
      <StatsCard title="Default" value={100} />
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('neutral');
  });
});