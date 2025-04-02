"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CreditCard, Dumbbell, DoorOpen } from "lucide-react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import Cookies from "js-cookie"

interface RoomBooking {
  id: string
  roomId: string
  checkIn: string
  checkOut: string
  numberOfGuests: number
  finalPrice: number
  status: string
  room: {
    number: string
    type: string
  }
}

interface FacilityBooking {
  id: string
  facilityId: string
  startTime: string
  endTime: string
  finalPrice: number
  status: string
  facility: {
    name: string
    type: string
  }
}

export default function BookingsList() {
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>([])
  const [facilityBookings, setFacilityBookings] = useState<FacilityBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const guestId = Cookies.get('guestId')
      if (!guestId) {
        toast.error('Please log in to view your bookings')
        return
      }

      const [roomsResponse, facilitiesResponse] = await Promise.all([
        fetch(`/api/bookings?guestId=${guestId}`),
        fetch(`/api/facility-bookings?guestId=${guestId}`)
      ])

      if (!roomsResponse.ok || !facilitiesResponse.ok) {
        throw new Error('Failed to fetch bookings')
      }

      const [roomsData, facilitiesData] = await Promise.all([
        roomsResponse.json(),
        facilitiesResponse.json()
      ])

      setRoomBookings(roomsData)
      setFacilityBookings(facilitiesData)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (roomBookings.length === 0 && facilityBookings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No bookings found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {roomBookings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Room Bookings</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roomBookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Room {booking.room.number}</CardTitle>
                  <Badge variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                    {booking.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="font-medium">Check-in</p>
                        <p className="text-muted-foreground">
                          {format(new Date(booking.checkIn), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="font-medium">Check-out</p>
                        <p className="text-muted-foreground">
                          {format(new Date(booking.checkOut), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DoorOpen className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="font-medium">Room Type</p>
                        <p className="text-muted-foreground">
                          {booking.room.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="font-medium">Price</p>
                        <p className="text-muted-foreground">
                          ${booking.finalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {facilityBookings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Facility Bookings</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {facilityBookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{booking.facility.name}</CardTitle>
                  <Badge variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                    {booking.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="font-medium">Date</p>
                        <p className="text-muted-foreground">
                          {format(new Date(booking.startTime), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="font-medium">Time</p>
                        <p className="text-muted-foreground">
                          {format(new Date(booking.startTime), 'h:mm a')} - {format(new Date(booking.endTime), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="font-medium">Type</p>
                        <p className="text-muted-foreground">
                          {booking.facility.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="font-medium">Price</p>
                        <p className="text-muted-foreground">
                          ${booking.finalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 