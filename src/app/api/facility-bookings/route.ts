import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Function to get day of week in uppercase format
function getDayOfWeek(date: Date): 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY' {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  return days[date.getDay()] as 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
}

// Function to update facility status based on booking dates
async function updateFacilityStatus(facilityId: string) {
  const now = new Date()
  
  // Find the most recent booking for this facility
  const latestBooking = await prisma.facilityBooking.findFirst({
    where: {
      facilityId,
      endTime: { gt: now },
      status: { in: ['CONFIRMED', 'CHECKED_IN'] }
    },
    orderBy: {
      endTime: 'desc'
    }
  })

  
  await prisma.facility.update({
    where: { id: facilityId },
    data: {
      status: latestBooking ? 'OCCUPIED' : 'AVAILABLE'
    }
  })
}

export async function POST(request: Request) {
  try {
    const { facilityId, guestId, startTime, endTime } = await request.json()

    // Validate required fields
    if (!facilityId || !guestId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if facility exists and is available
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        bookings: {
          where: {
            OR: [
              {
                AND: [
                  { startTime: { lte: new Date(endTime) } },
                  { endTime: { gte: new Date(startTime) } }
                ]
              }
            ]
          }
        }
      }
    })

    if (!facility) {
      return NextResponse.json(
        { error: 'Facility not found' },
        { status: 404 }
      )
    }

    // Check if facility is available for the selected time
    if (facility.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'Facility is not available' },
        { status: 400 }
      )
    }

    // Check if the booking time is within operating hours
    const startDate = new Date(startTime)
    const dayOfWeek = getDayOfWeek(startDate)
    
    const operatingHours = await prisma.operatingHours.findFirst({
      where: {
        facilityId,
        dayOfWeek
      }
    })

    if (!operatingHours) {
      return NextResponse.json(
        { error: 'Facility is not open on this day' },
        { status: 400 }
      )
    }

    const [openHour, openMinute] = operatingHours.openTime.split(':').map(Number)
    const [closeHour, closeMinute] = operatingHours.closeTime.split(':').map(Number)
    
    const openTime = new Date(startDate)
    openTime.setHours(openHour, openMinute, 0, 0)
    
    const closeTime = new Date(startDate)
    closeTime.setHours(closeHour, closeMinute, 0, 0)

    if (startDate < openTime || startDate > closeTime) {
      return NextResponse.json(
        { error: `Facility is only open from ${operatingHours.openTime} to ${operatingHours.closeTime}` },
        { status: 400 }
      )
    }

    // Calculate duration in hours
    const startDateTime = new Date(startTime)
    const endDateTime = new Date(endTime)
    const duration = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60)

    // Calculate final price
    let finalPrice = facility.basePrice * duration

    // Check for VIP discount
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: { membership: true }
    })

    if (guest?.membership && facility.vipDiscount) {
      finalPrice = finalPrice * (1 - facility.vipDiscount / 100)
    }

    // Create the booking and update facility status if the booking number exceeds the capacity in a transaction 
    const facilityBookings = await prisma.facilityBooking.findMany({
      where: {
        facilityId
      }
    })

    if (facilityBookings.length >= facility.capacity) {
      await prisma.facility.update({
        where: { id: facilityId },
        data: { status: 'OCCUPIED' }
      })

      return NextResponse.json(
        { error: 'Facility is at capacity' },
        { status: 400 }
      )
    }

    

    const booking = await prisma.facilityBooking.create({
      data: {
        facilityId,
        guestId,
        startTime: startDateTime,
        endTime: endDateTime,
        finalPrice,
        status: 'CONFIRMED'
      }
    }) 

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

    // Update facility statuses before fetching bookings
    const bookings = await prisma.facilityBooking.findMany({
      where: {
        guestId
      },
      include: {
        facility: true
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    // Update status for all facilities in the bookings
    await Promise.all(bookings.map(booking => updateFacilityStatus(booking.facilityId)))

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
} 