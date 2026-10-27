import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../DataProvider.jsx'

export default function FormPage() {
  const navigate = useNavigate()
  const { saveData } = useData()
  const [field1, setField1] = useState('')
  const [field2, setField2] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!field1.trim() || !field2.trim()) {
      setError('Please fill in both fields.')
      return
    }

    setError('')
    saveData(field1.trim(), field2.trim())
    navigate('/display')
  }

  return (
    <section className="card">
      <h1>Page 1 — Enter Data</h1>
      <p className="subtitle">Type in both fields, then press the button to display them together on page 2.</p>

      <form onSubmit={handleSubmit} className="form">
        <label htmlFor="field1">Name</label>
        <input
          id="field1"
          type="text"
          placeholder="Enter your name"
          value={field1}
          onChange={(event) => setField1(event.target.value)}
        />

        <label htmlFor="field2">Email</label>
        <input
          id="field2"
          type="text"
          placeholder="Enter your email"
          value={field2}
          onChange={(event) => setField2(event.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <button type="submit">Check &amp; Display</button>
      </form>
    </section>
  )
}
