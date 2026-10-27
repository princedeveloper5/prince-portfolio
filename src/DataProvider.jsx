import { createContext, useContext, useState } from 'react'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [formData, setFormData] = useState({ field1: '', field2: '' })

  const saveData = (field1, field2) => setFormData({ field1, field2 })

  return (
    <DataContext.Provider value={{ formData, saveData }}>{children}</DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used inside a DataProvider')
  }
  return context
}
