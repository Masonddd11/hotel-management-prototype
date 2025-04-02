import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Function to update room status based on booking dates
async function updateRoomStatus(roomId: string) {
  const now = new Date()
  
  // Find the most recent booking for this room
  const latestBooking = await prisma.roomBooking.findFirst({
    where: {
      roomId,
      checkOut: { gt: now },
      status: { in: ['CONFIRMED', 'CHECKED_IN'] }
    },
    orderBy: {
      checkOut: 'desc'
    }
  })

  // Update room status based on booking
  await prisma.room.update({
    where: { id: roomId },
    data: {
      status: latestBooking ? 'OCCUPIED' : 'AVAILABLE'
    }
  })
}

export async function POST(request: Request) {
  try {
    const { roomId, guestId, checkIn, checkOut, guests } = await request.json()

    // Validate required fields
    if (!roomId || !guestId || !checkIn || !checkOut || !guests) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if room exists and is available
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        bookings: {
          where: {
            OR: [
              {
                AND: [
                  { checkIn: { lte: new Date(checkOut) } },
                  { checkOut: { gte: new Date(checkIn) } }
                ]
              }
            ]
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Check if room is available for the selected dates
    if (room.bookings.length > 0) {
      return NextResponse.json(
        { error: 'Room is not available for the selected dates' },
        { status: 400 }
      )
    }

    // Check if number of guests exceeds room capacity
    if (guests > room.capacity) {
      return NextResponse.json(
        { error: `Room capacity is ${room.capacity} guests` },
        { status: 400 }
      )
    }

    // Calculate number of nights
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate final price
    let finalPrice = room.basePrice * nights

    // Check for VIP discount
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: { membership: true }
    })

    if (guest?.membership && room.vipDiscount) {
      finalPrice = finalPrice * (1 - room.vipDiscount / 100)
    }

    // Create the booking and update room status in a transaction
    const [booking] = await prisma.$transaction([
      prisma.roomBooking.create({
        data: {
          roomId,
          guestId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          numberOfGuests: guests,
          finalPrice,
          status: 'CONFIRMED'
        }
      }),
      prisma.room.update({
        where: { id: roomId },
        data: { status: 'OCCUPIED' }
      })
    ])

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const guestId = searchParams.get('guestId')

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      )
    }

    // Update room statuses before fetching bookings
    const bookings = await prisma.roomBooking.findMany({
      where: {
        guestId
      },
      include: {
        room: true
      },
      orderBy: {
        checkIn: 'desc'
      }
    })

    // Update status for all rooms in the bookings
    await Promise.all(bookings.map(booking => updateRoomStatus(booking.roomId)))

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
} 