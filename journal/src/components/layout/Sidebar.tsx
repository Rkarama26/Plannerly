"use client"

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Button } from "../ui/button"
import {
    Calendar,
    CheckSquare,
    BookOpen,
    Target,
    TrendingUp,
    Heart,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false)
    const { user, logout } = useAuth()
    const location = useLocation()

    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: BarChart3, path: "/dashboard" },
        { id: "calendar", label: "Calendar", icon: Calendar, path: "/calendar" },
        { id: "tasks", label: "Tasks", icon: CheckSquare, path: "/tasks" },
        { id: "journal", label: "Journal", icon: BookOpen, path: "/journal" },
        { id: "goals", label: "Goals", icon: Target, path: "/goals" },
        { id: "mood", label: "Mood", icon: Heart, path: "/mood" },
    ]

    const isActive = (path: string) => {
        return location.pathname === path || (path === "/dashboard" && location.pathname === "/")
    }

    return (
        <>
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Sidebar */}
            <div
                className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:inset-0
      `}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-border">
                        <h1 className="text-xl font-bold text-primary">Digital Planner</h1>
                        <p className="text-sm text-muted-foreground mt-1">Welcome, {user?.name}</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link key={item.id} to={item.path} onClick={() => setIsOpen(false)} className="block">
                                    <Button variant={isActive(item.path) ? "default" : "ghost"} className="w-full justify-start">
                                        <Icon className="h-4 w-4 mr-3" />
                                        {item.label}
                                    </Button>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-border space-y-2">
                        <Button variant="ghost" className="w-full justify-start">
                            <Settings className="h-4 w-4 mr-3" />
                            Settings
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-destructive hover:text-destructive"
                            onClick={logout}
                        >
                            <LogOut className="h-4 w-4 mr-3" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile overlay */}
            {isOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsOpen(false)} />}
        </>
    )
}
