import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import { useState, useEffect } from "react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import CalendarBooking from "./components/CalendarBooking";
import Form from "./components/Form";

interface MeetingRoom {
  ID: number;
  title: string;
  description: string;
  hourly_rate: number;
  daily_rate: number;
  permalink: string;
  featured_image: string;
  booked_slots: any;
}

type TimeSlot = {
  checkIn: Date | null;
  checkOut: Date | null;
};

type RoomBookingDetails = {
  room_name: string;
  id: string;
  max_seats: number;
  cta_map_link: string;
  hourly_rate: number;
  daily_rate: number;
  operating_hours_start: string;
  operating_hours_end: string;
  operating_days_starts: string;
  operating_days_ends: string;
};

export default function App() {
  const [open, setOpen] = useState<boolean>(false);
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[] | null>(null);
  const [filteredMeetingRooms, setFilteredMeetingRooms] = useState<
    MeetingRoom[] | null
  >(null);
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(null);

  const [timeSlot, setTimeSlot] = useState<TimeSlot | null>();
  const [bookedDate, setBookedDate] = useState<Date | null>(null);
  const [
    roomBookingDetails,
    setRoomBookingDetails,
  ] = useState<RoomBookingDetails | null>(null);
  const [checkout, setCheckout] = useState<Date | undefined | null>(null);
  const [checkin, setCheckin] = useState<Date | undefined | null>(null);

  let location_id = document.getElementById("location_id") as HTMLElement;
  const location_value = location_id as HTMLInputElement;

  let site_url = document.getElementById("site_url") as HTMLElement;
  const site_url_value = site_url as HTMLInputElement;

  let user_id = document.getElementById("current_user_id") as HTMLElement;
  const user_id_value = user_id as HTMLInputElement;

  const fetchData = async () => {
    try {
      // Only include non-null parameters in `params`
      const params = {
        room_location: location_id !== null ? location_value.value : null,
        number_of_seats: "",
        checkin: "",
        checkout: "",
      };

      // Remove null values from `params`
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== null)
      );

      // Fetch data from both APIs concurrently
      const roomsResponse = await axios.get(
        `${site_url_value.value}/wp-json/v2/rooms`,
        {
          params: filteredParams, // Use only non-null parameters
        }
      );
      const sortedMeetingRooms = roomsResponse.data
        .map((room: MeetingRoom) => room)
        .sort((a: any, b: any) => a.title.localeCompare(b.title));

      setMeetingRooms(sortedMeetingRooms);
      setFilteredMeetingRooms(sortedMeetingRooms);
    } catch (err) {
      setMeetingRooms([]);
      console.error("Failed to fetch from multiple APIs:", err);
    }
  };

  const fetchRoomBookingDetails = async () => {
    if (selectedRoom) {
      try {
        const room_booking = await axios.get(
          `${site_url_value.value}/wp-json/v2/booking-details/${selectedRoom.ID}`
        );
        setRoomBookingDetails(room_booking.data);
        setCheckin(null);
        setCheckout(null);
        setTimeSlot(null);
      } catch (error) {
        setRoomBookingDetails(null);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchRoomBookingDetails();
  }, [selectedRoom]);

  const searchMeetingRooms = (room_name: string) => {
    if (!meetingRooms) {
      setFilteredMeetingRooms([]);
      return;
    }

    const filteredData = meetingRooms.filter((item: MeetingRoom) =>
      item.title.toLowerCase().includes(room_name.toLowerCase())
    );
    setFilteredMeetingRooms(filteredData);
  };

  return (
    <div className="container h-screen mx-auto p-8 ">
      <Popover open={open}>
        <PopoverTrigger
          onClick={() => {
            setOpen(!open);
          }}
          className="w-full py-6"
        >
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className={cn(
              `w-full rounded-md custom-h-sm  px-4 py-2 gap-3 justify-between text-sm font-normal hover:translate-y-0 hover:bg-transparent`
            )}
            tabIndex={-1}
          >
            {selectedRoom ? selectedRoom?.title : "Select a Meeting Room"}

            <ChevronDown className="w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[75vw] container py-4 mx-auto shadow-lg rounded-sm p-2 z-10 bg-white"
          align="start"
        >
          <input
            tabIndex={-1}
            type="text"
            placeholder="Search country..."
            className="w-full py-2 px-4 outline-none  "
            onChange={(e) => {
              // @ts-ignore
              searchMeetingRooms(e.target.value);
            }}
          />
          <div className="flex flex-col max-h-[240px] overflow-y-auto space-y-1 p-1">
            {filteredMeetingRooms && filteredMeetingRooms.length > 0 ? (
              filteredMeetingRooms.map((room) => (
                <button
                  type="button"
                  key={room.ID}
                  className={`text-left p-2 hover:bg-gray-400 text-sm items-center flex hover:text-white rounded-sm transition-all ${
                    selectedRoom && room.ID === selectedRoom.ID
                      ? "bg-gray-400 text-white"
                      : "bg-white"
                  }`}
                  onClick={() => {
                    setSelectedRoom(room);
                    setOpen(false);
                  }}
                >
                  {room.title}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedRoom && room.ID === selectedRoom.ID
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </button>
              ))
            ) : (
              <span className="text-left p-2 hover:bg-gray-400 items-center flex hover:text-white rounded-sm transition-all">
                No room found.
              </span>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <CalendarBooking
            timeSlot={timeSlot}
            roomBookingDetails={roomBookingDetails}
            bookedDate={bookedDate}
            setBookedDate={setBookedDate}
            setTimeSlot={setTimeSlot}
            containerStyles="w-full col-span-1 md:col-span-1 lg:col-span-2 shadow-lg rounded-lg"
            checkin={checkin}
            checkout={checkout}
            setCheckin={setCheckin}
            setCheckout={setCheckout}
          />
        </div>
        <div>
          <Form
            containerStyles="w-full col-span-1 md:col-span-1 lg:col-span-2 shadow-lg rounded-lg"
            roomBookingDetails={roomBookingDetails}
            timeSlot={timeSlot}
            product_id={selectedRoom?.ID}
            checkin={checkin}
            checkout={checkout}
            setCheckin={setCheckin}
            setCheckout={setCheckout}
            user_id_value={user_id_value.value}
          />
        </div>
      </div>
    </div>
  );
}
