import { User } from "../store/user/userSlice"

export async function fetchUserByEmail(email: string): Promise<User> {
    const response = await fetch(`/api/user/${email}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const result = await response.json()
  
    return result
  }
  