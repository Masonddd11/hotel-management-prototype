"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DoorOpen, Dumbbell, Users, Calendar } from "lucide-react"

interface Stats {
  totalRooms: number
  totalFacilities: number
  activeGuests: number
  totalBookings: number
  availableRooms: number
  availableFacilities: number
  pendingCheckIns: number
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalRooms: 0,
    totalFacilities: 0,
    activeGuests: 0,
    totalBookings: 0,
    availableRooms: 0,
    availableFacilities: 0,
    pendingCheckIns: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [roomsRes, facilitiesRes, bookingsRes] = await Promise.all([
          fetch('/api/rooms'),
          fetch('/api/facilities'),
          fetch('/api/bookings')
        ])

        const rooms = await roomsRes.json()
        const facilities = await facilitiesRes.json()
        const bookings = await bookingsRes.json()

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        setStats({
          totalRooms: rooms.length,
          totalFacilities: facilities.length,
          activeGuests: bookings.filter((b: any) => b.status === 'CHECKED_IN').length,
          totalBookings: bookings.length,
          availableRooms: rooms.filter((r: any) => r.status === 'AVAILABLE').length,
          availableFacilities: facilities.filter((f: any) => f.status === 'AVAILABLE').length,
          pendingCheckIns: bookings.filter((b: any) => 
            b.status === 'CONFIRMED' && 
            new Date(b.checkIn) >= today
          ).length
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>
      ))}
    </div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
          <DoorOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalRooms}</div>
          <p className="text-xs text-muted-foreground">
            {stats.availableRooms} rooms available
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Facilities</CardTitle>
          <Dumbbell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalFacilities}</div>
          <p className="text-xs text-muted-foreground">
            {stats.availableFacilities} currently available
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Guests</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeGuests}</div>
          <p className="text-xs text-muted-foreground">
            Currently checked in
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bookings</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBookings}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pendingCheckIns} pending check-in today
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 