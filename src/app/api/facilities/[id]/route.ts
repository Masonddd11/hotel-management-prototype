import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { DayOfWeek } from '@prisma/client'

// GET /api/facilities/[id] - Get a specific facility
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const facility = await prisma.facility.findUnique({
      where: {
        id,
      },
      include: {
        operatingHours: true,
        bookings: true,
      },
    })
    
    if (!facility) {
      return NextResponse.json(
        { error: 'Facility not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(facility)
  } catch (error) {
    console.error('Error fetching facility:', error)
    return NextResponse.json(
      { error: 'Failed to fetch facility' },
      { status: 500 }
    )
  }
}

// PUT /api/facilities/[id] - Update a facility
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    // First, update the facility
    const facility = await prisma.facility.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        type: data.type,
        basePrice: data.basePrice,
        vipDiscount: data.vipDiscount,
        capacity: data.capacity,
        description: data.description || '',
        status: data.status,
      },
      include: {
        operatingHours: true,
      },
    })
    
    // If operatingHours are provided, update them
    if (data.operatingHours && Array.isArray(data.operatingHours)) {
      // Delete all existing hours
      await prisma.operatingHours.deleteMany({
        where: {
          facilityId: id,
        },
      })
      
      // Create new hours
      const hours = await Promise.all(
        data.operatingHours.map((hour: { dayOfWeek: DayOfWeek; openTime: string; closeTime: string }) =>
          prisma.operatingHours.create({
            data: {
              facilityId: id,
              dayOfWeek: hour.dayOfWeek,
              openTime: hour.openTime,
              closeTime: hour.closeTime,
            },
          })
        )
      )
      
      // Return the updated facility with new hours
      return NextResponse.json({
        ...facility,
        operatingHours: hours,
      })
    }
    
    return NextResponse.json(facility)
  } catch (error) {
    console.error('Error updating facility:', error)
    return NextResponse.json(
      { error: 'Failed to update facility' },
      { status: 500 }
    )
  }
}

// DELETE /api/facilities/[id] - Delete a facility
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // First delete all operating hours
    await prisma.operatingHours.deleteMany({
      where: {
        facilityId: id,
      },
    })
    
    // Then delete the facility
    await prisma.facility.delete({
      where: {
        id,
      },
    })
    
    return NextResponse.json({ message: 'Facility deleted successfully' })
  } catch (error) {
    console.error('Error deleting facility:', error)
    return NextResponse.json(
      { error: 'Failed to delete facility' },
      { status: 500 }
    )
  }
} 