import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )

    // Simple testing just to get Jest started
    // Also for me to see how Jest and testing works
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })
})