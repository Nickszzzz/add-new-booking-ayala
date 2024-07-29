import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ThreeDots } from "react-loader-spinner";
import { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import nProgress from "nprogress";

import { IoCloseSharp } from "react-icons/io5";
import { useToast } from "@/components/ui/use-toast";

// icons
import { IoLocationOutline } from "react-icons/io5";
import { HiOutlineHome } from "react-icons/hi";
import { LucideCalendar } from "lucide-react";
import { DateCounter } from "@/lib/utils";
// utils
import { convertDate } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
type TimeSlot = {
  checkIn: Date | null;
  checkOut: Date | null;
};

interface MeetingRoom {
  id: number;
  product_id: number;
  room_name: string;
  number_of_seats: number;
  checkin: string;
  checkout: string;
  rate: number;
  booking_type: string;
}

const doesTimeMatch = (date: Date, desiredTime: string): boolean => {
  // Define options for formatting the time
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone: "Asia/Manila",
  };

  // Format the provided date to the specified time zone
  const formattedTime = new Intl.DateTimeFormat("en-US", options).format(date);

  // Check if the formatted time matches the desired time
  return formattedTime === desiredTime;
};

export const formattedNumber = (rate: any) => {
  const formattedNumber = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(rate);

  return formattedNumber.replace("₱", "₱ ");
};
const Form = ({
  containerStyles,
  roomBookingDetails,
  timeSlot,
  product_id,
  checkin,
  checkout,
  setCheckin,
  setCheckout,
  user_id_value,
}: {
  containerStyles: string;
  roomBookingDetails: RoomBookingDetails | null | undefined;
  timeSlot: TimeSlot | null | undefined;
  product_id: any;
  checkin: Date | null | undefined;
  checkout: Date | null | undefined;
  setCheckin: any;
  setCheckout: any;
  user_id_value: any;
}) => {
  const [roomName, setRoomName] = useState<any>();
  const [productId, setProductId] = useState<any>();
  const [numberOfSeats, setNumberOfSeats] = useState<any>();
  const [rate, setRate] = useState<any>();
  const [bookingType, setBookingType] = useState<any>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFormCompeleted, setIsFormCompleted] = useState<boolean>(false);
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[] | null>(null);
  const [error, setError] = useState<string | null>();

  let site_url = document.getElementById("site_url") as HTMLElement;
  const site_url_value = site_url as HTMLInputElement;
  const { toast } = useToast();

  useEffect(() => {
    if (roomBookingDetails && checkin && checkout) {
      const isCheckinMatch = doesTimeMatch(
        checkin,
        roomBookingDetails.operating_hours_start
      );

      const isCheckoutMatch = doesTimeMatch(
        checkout,
        roomBookingDetails.operating_hours_end
      );

      if (isCheckinMatch && isCheckoutMatch) {
        setRate(roomBookingDetails.daily_rate);
        setBookingType("daily");
      } else {
        setRate(roomBookingDetails.hourly_rate);
        setBookingType("hourly");
      }
    }
  }, [checkin, checkout]);

  useEffect(() => {
    if (roomName && numberOfSeats && checkin && checkout) {
      setIsFormCompleted(true);
    } else {
      setIsFormCompleted(false);
    }
  }, [checkin, checkout, roomName, numberOfSeats]);

  useEffect(() => {
    if (timeSlot) {
      setCheckin(timeSlot?.checkIn);
      setCheckout(timeSlot?.checkOut);
    }
  }, [timeSlot]);

  // Load meeting rooms from localStorage when the component mounts
  useEffect(() => {
    const storedRooms: string | null = localStorage.getItem("meeting-rooms");
    if (storedRooms && storedRooms !== "undefined") {
      let meetingRooms = JSON.parse(storedRooms);
      setMeetingRooms(meetingRooms);
    }
  }, []);

  // Save meeting rooms to localStorage whenever it changes
  useEffect(() => {
    if (meetingRooms !== null) {
      localStorage.setItem("meeting-rooms", JSON.stringify(meetingRooms));
    }
  }, [meetingRooms]);

  useEffect(() => {
    if (roomBookingDetails) {
      setRoomName(roomBookingDetails?.room_name);
      setProductId(product_id);
      setNumberOfSeats(roomBookingDetails?.max_seats);
      setRate(roomBookingDetails.hourly_rate);
      setBookingType("hourly");
    }
  }, [roomBookingDetails, product_id]);

  const formatDateString = (inputDateString: Date | any) => {
    const date = new Date(inputDateString);

    const options = {
      year: "numeric" as const,
      month: "long" as const,
      day: "numeric" as const,
      hour: "2-digit" as const,
      minute: "2-digit" as const,
      second: "2-digit" as const,
      hour12: true,
    };

    return date.toLocaleString("en-US", options);
  };

  const [totalWorkingHours, setTotalWorkingHours] = useState<number>();

  useEffect(() => {
    const fetchCalcWorkingHours = async () => {
      if (roomBookingDetails && checkin && checkout) {
        try {
          const response = await axios.get(
            `${site_url_value.value}/wp-json/v2/calculate-working-hours`,
            {
              params: {
                room_id: product_id,
                checkin: formatDateString(checkin),
                checkout: formatDateString(checkout),
                operatingHoursStart: roomBookingDetails.operating_days_starts,
                operatingHoursEnd: roomBookingDetails.operating_hours_end,
                operatingDaysStarts: roomBookingDetails.operating_days_starts,
                operatingDaysEnds: roomBookingDetails.operating_days_ends,
              },
            }
          );

          const total = response.data.total_working_hours;
          setTotalWorkingHours(total);
        } catch (error) {
          console.error("Error fetching working hours:", error);
          // Handle error if needed
        }
      }
    };
    fetchCalcWorkingHours();
  }, [checkin, checkout, roomBookingDetails]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (
      productId &&
      roomName &&
      numberOfSeats &&
      checkin &&
      checkout &&
      roomBookingDetails
    ) {
      if (!totalWorkingHours) return;

      if (!roomBookingDetails) return;

      const payload: any = {};
      let workingHours: number;
      if (bookingType === "hourly") {
        workingHours = totalWorkingHours;
      } else {
        workingHours = DateCounter(
          formatDateString(checkin.toString()),
          formatDateString(checkout.toString()),
          roomBookingDetails.operating_days_starts,
          roomBookingDetails.operating_days_ends
        );
      }

      payload["user_id"] = user_id_value;
      payload["product_id"] = productId;

      payload["Overall Total"] = 0;
      payload["VAT"] = 0;
      payload["Time (no. of hrs)"] = workingHours;
      payload["Booking Type"] = `${
        bookingType === "hourly" ? "Hourly Rate" : "Daily Rate"
      } (${formattedNumber(rate)} / ${
        bookingType === "hourly" ? "hr" : "day"
      })`;
      payload["Booking Date"] = `${convertDate(
        formatDateString(checkin?.toString())
      )} - ${convertDate(formatDateString(checkout?.toString()))}`;
      payload["Meeting Room Name"] = roomName;
      console.log(payload);
      createOrder(payload);
    } else {
      setIsLoading(false);
    }
  };

  const createOrder = async (orderData: any) => {
    try {
      setIsLoading(true);
      setIsFormCompleted(true);
      setError("");

      const response = await axios.post(
        `${site_url_value.value}/wp-json/v2/create-order`,
        orderData
      );

      if (response?.data) {
        setIsLoading(false);
        setError("");
        nProgress.start();
        window.location.href = `${site_url_value.value}/wp-admin/edit.php?post_type=booking`;
        // Redirect or handle success
      } else {
        setError(response?.data?.error || "Failed to create order");
        setIsLoading(false);
      }
    } catch (error) {
      // @ts-ignore
      // setError(error.response.data.message);
      toast({
        variant: "warning",
        title: "Heads Up!",
        description:
          "Another user is currently booking this meeting room. Please try again later.",
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className={containerStyles}>
      <CardHeader>
        <CardTitle>Book Now</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="w-full grid gap-8 bg-white/40 grid-cols-1 "
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <div className="bg-white relative rounded-lg">
              <IoLocationOutline className="absolute w-5 h-5 top-2.5 left-2.5 z-10" />
              <Input
                tabIndex={-1}
                placeholder="Search Location"
                className="border border-gray-100 py-3 px-6 pl-9 rounded-lg outline-none disabled:opacity-100"
                value={roomName && roomName ? roomName : ""}
                disabled
              />
              <input
                tabIndex={-1}
                type="hidden"
                name="room_name"
                value={roomName && roomName ? roomName : ""}
              />
            </div>
            <div className="bg-white relative rounded-lg">
              <HiOutlineHome className="absolute w-5 h-5 top-2.5 left-2.5  z-10" />
              <Input
                tabIndex={-1}
                placeholder="Number of Seats"
                className="border border-gray-100 py-3 px-6 pl-9 rounded-lg outline-none disabled:opacity-100"
                value={numberOfSeats && numberOfSeats ? numberOfSeats : ""}
                disabled
              />
              <input
                tabIndex={-1}
                type="hidden"
                name="number_of_seats"
                value={numberOfSeats && numberOfSeats ? numberOfSeats : ""}
              />
            </div>
            <div className="bg-white relative rounded-lg">
              <LucideCalendar className="absolute w-5 h-5 top-2.5 left-2.5  z-10" />
              <Input
                tabIndex={-1}
                placeholder="Check-In"
                className="border border-gray-100 py-3 px-6 pl-9 rounded-lg outline-none disabled:opacity-100"
                value={checkin ? formatDateString(checkin?.toString()) : ""}
                disabled
              />
              {checkin && (
                <IoCloseSharp
                  className="absolute w-5 h-5 top-2.5 right-2.5  z-10 text-red-500 cursor-pointer"
                  onClick={() => {
                    setError(undefined);
                    setCheckin(null);
                  }}
                />
              )}
              <input
                tabIndex={-1}
                type="hidden"
                name="checkin"
                value={checkin ? checkin?.toString() : ""}
              />
              <input
                tabIndex={-1}
                type="hidden"
                name="product_id"
                value={productId ? productId : ""}
              />
            </div>
            <div className="bg-white relative rounded-lg">
              <LucideCalendar className="absolute w-5 h-5 top-2.5 left-2.5 z-10" />
              <Input
                tabIndex={-1}
                placeholder="Check-Out"
                name="checkout"
                className="border border-gray-100 py-3 px-6 pl-9 rounded-lg outline-none disabled:opacity-100"
                value={checkout ? formatDateString(checkout?.toString()) : ""}
                disabled
              />
              {checkout && (
                <IoCloseSharp
                  className="absolute w-5 h-5 top-2.5 right-2.5  z-10 text-red-500 cursor-pointer"
                  onClick={() => {
                    setError(undefined);
                    setCheckout(null);
                  }}
                />
              )}
              <input
                tabIndex={-1}
                type="hidden"
                name="checkout"
                value={checkout ? checkout?.toString() : ""}
              />
            </div>
            {error && <span className="text-red-500 text-sm">{error}</span>}
          </div>
          <Button
            className="bg-primary text-white text-md font-semibold py-3 px-6 rounded-lg"
            disabled={!isFormCompeleted}
          >
            <span className={`${isLoading ? "hidden" : "block"}`}>
              Book Now
            </span>
            <ThreeDots
              visible={true}
              height="50"
              width="50"
              color="#4fa94d"
              radius="9"
              ariaLabel="three-dots-loading"
              wrapperStyle={{}}
              wrapperClass={`${isLoading ? "block" : "!hidden"}`}
            />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Form;
