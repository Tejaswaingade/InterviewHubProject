const TOKEN_KEY = 'token'
const USER_KEY = 'user'

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch (err) {
    console.error('[Storage] Error reading token from localStorage:', err)
    return null
  }
}

export const setToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch (err) {
    console.error('[Storage] Error saving token to localStorage:', err)
  }
}

export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch (err) {
    console.error('[Storage] Error removing token from localStorage:', err)
  }
}

export const getUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.error('[Storage] Error reading user from localStorage:', err)
    return null
  }
}

export const setUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_KEY)
    }
  } catch (err) {
    console.error('[Storage] Error saving user to localStorage:', err)
  }
}

export const removeUser = () => {
  try {
    localStorage.removeItem(USER_KEY)
  } catch (err) {
    console.error('[Storage] Error removing user from localStorage:', err)
  }
}

export const clearStorage = () => {
  removeToken()
  removeUser()
}

export const storage = {
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
  clear: clearStorage,
}

export default storage
