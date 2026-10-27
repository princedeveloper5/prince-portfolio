import { Link } from 'react-router-dom'
import { useData } from '../DataProvider.jsx'

export default function DisplayPage() {
  const { formData } = useData()
  const isEmpty = !formData.field1 && !formData.field2

  return (
    <section className="card">
      <h1>Page 2 — Display Data</h1>
      <p className="subtitle">The values entered on page 1, shown together.</p>

      {isEmpty ? (
        <div className="empty">
          <p>No data entered yet.</p>
          <Link className="button-link" to="/">
            Go to Enter Data
          </Link>
        </div>
      ) : (
        <div className="result">
          <div className="result-row">
            <span className="result-label">Name</span>
            <span className="result-value">{formData.field1}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Email</span>
            <span className="result-value">{formData.field2}</span>
          </div>
        </div>
      )}

      <Link className="back-link" to="/">
        ← Back to form
      </Link>
    </section>
  )
}
