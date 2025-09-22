
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "../lib/types"
import { firebaseService } from "../lib/firebase"
import { useNavigate } from "react-router"


interface AuthContextType {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<boolean>
    register: (email: string, password: string, name: string) => Promise<boolean>
    logout: () => void
    guestLogin: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()


    useEffect(() => {
        // Check for stored user session
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
        setLoading(false)
    }, [])

    //login existing user
    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            setLoading(true)
            const users = await firebaseService.getUsers()

            if (users) {
                const userEntry = Object.entries(users).find(
                    ([_, userData]: [string, any]) => userData.email === email && userData.password === password,
                )

                if (userEntry) {
                    const [id, userData] = userEntry
                    const user: User = {
                        id,
                        email: userData.email,
                        name: userData.name,
                        createdAt: userData.createdAt,
                    }

                    setUser(user)
                    localStorage.setItem("user", JSON.stringify(user))
                    navigate("/dashboard")
                    return true
                }
            }
            return false
        } catch (error) {
            console.error("Login error:", error)
            return false
        } finally {
            setLoading(false)
        }
    }

    // Register new user
    const register = async (email: string, password: string, name: string): Promise<boolean> => {
        try {
            setLoading(true)

            // Check if user already exists
            const users = await firebaseService.getUsers()
            if (users) {
                const existingUser = Object.values(users).find((userData: any) => userData.email === email)
                if (existingUser) {
                    return false //  already exists
                }
            }

            const userData = {
                email,
                password, //  this will be hashed
                name,
                createdAt: new Date().toISOString(),
            }

            const result = await firebaseService.createUser(userData)
            if (result) {
                const user: User = {
                    id: result.name,
                    email,
                    name,
                    createdAt: userData.createdAt,
                }

                setUser(user)
                localStorage.setItem("user", JSON.stringify(user))
                navigate("/dashboard")
                return true
            }
            return false
        } catch (error) {
            console.error("Registration error:", error)
            return false
        } finally {
            setLoading(false)
        }
    }

    // Logout user
    const logout = () => {
        setUser(null)
        localStorage.removeItem("user")
        localStorage.removeItem("isGuest")

        navigate("/login")
    }

    const guestLogin = () => {
        const guestUser = {
            id: "guest",
            name: "Guest User",
            email: "guest@example.com",
            isGuest: true,
            createdAt: new Date().toISOString(),
        };
        setUser(guestUser);
        localStorage.setItem("user", JSON.stringify(guestUser));
        //  can detect guest vs real user
        localStorage.setItem("isGuest", "true")
    };

    return <AuthContext.Provider value={{ user, loading, login, register, logout, guestLogin }}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
