import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineWave } from "react-loader-spinner";
import { Matcher } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { useEffect, useState } from "react";
import { parseTime } from "@/lib/utils";
import { isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { generateOperatingHours } from "@/lib/utils";
import $ from "jquery";
import { SelectSingleEventHandler } from "react-day-picker";
import { Skeleton } from "./ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Status = {
  class: string;
  name: string;
};

interface TimeSlot {
  time: string;
  status: "enabled" | "disabled";
}

export type TimeSlot1 = {
  checkIn: Date | null;
  checkOut: Date | null;
};

interface RoomBookingDetails {
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
}
import axios from "axios";
const statuses: Status[] = [
  {
    name: "Available",
    class: "after:bg-primary after:border after:border-primary",
  },
  {
    name: "Selected",
    class: "after:bg-gray-300 ",
  },
  {
    name: "Fully Booked",
    class: "after:bg-primary fully-booked",
  },
  {
    name: "Partially Booked ",
    class: "after:bg-yellow-500  ",
  },
];

const formatDate = (dateString: any) => {
  const date = new Date(dateString);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
};

const CalendarBooking = ({
  timeSlot,
  containerStyles,
  roomBookingDetails,
  bookedDate,
  setBookedDate,
  checkin,
  checkout,
  setCheckin,
  setCheckout,
}: {
  containerStyles: string;
  timeSlot?: TimeSlot1 | null | undefined;
  setTimeSlot?: any;
  roomBookingDetails?: RoomBookingDetails | null | undefined;
  bookedDate?: Date | null | undefined;
  setBookedDate?: any;
  checkin: Date | null | undefined;
  checkout: Date | null | undefined;
  setCheckin: any;
  setCheckout: any;
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<string | null>();
  const [endTime, setEndTime] = useState<string | null>();
  const [operatingHours, setOperatingHours] = useState<TimeSlot[] | null>();
  const [paidDate, setPaidDate] = useState<Matcher[]>();
  const [partialDate, setPartialDate] = useState<Matcher[]>();
  const [loadingTime, setLoadingTime] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>("start");

  let site_url = document.getElementById("site_url") as HTMLElement;
  const site_url_value = site_url as HTMLInputElement;

  const handleSelect = async () => {
    if (!bookedDate) return;
    const current_date = formatDate(bookedDate);

    setOpen(true);

    let isSameDate = true;
    if (checkin) {
      isSameDate = isSameDay(checkin, bookedDate);
    }
    if (checkout) {
      isSameDate = isSameDay(checkout, bookedDate);
    }

    if (roomBookingDetails) {
      try {
        setLoadingTime(true);
        const disabledTimes = await axios.get(
          `${site_url_value.value}/wp-json/v2/disabled-dates/`,
          {
            params: {
              id: roomBookingDetails.id,
              current_date: current_date,
            },
          }
        );

        if (disabledTimes.data && current_date) {
          const operatingHours = generateOperatingHours(
            roomBookingDetails.operating_hours_start,
            roomBookingDetails.operating_hours_end,
            disabledTimes.data,
            current_date
          );

          setOperatingHours(operatingHours);

          if (currentTab === "end" && startTime && isSameDate) {
            const start = parseTime(startTime);

            setOperatingHours((prevOperatingHours) => {
              if (!prevOperatingHours) return null;
              return prevOperatingHours.map((slot) => {
                const slotTime = parseTime(slot.time);
                if (slotTime <= start) {
                  return { ...slot, status: "disabled" };
                }
                return slot;
              });
            });
          }

          if (currentTab === "start" && endTime && isSameDate) {
            const end = parseTime(endTime);

            setOperatingHours((prevOperatingHours) => {
              if (!prevOperatingHours) return null;
              return prevOperatingHours.map((slot) => {
                const slotTime = parseTime(slot.time);
                if (slotTime >= end) {
                  return { ...slot, status: "disabled" };
                }
                return slot;
              });
            });
          }

          setLoadingTime(false);
        }
      } catch (error) {
        setLoadingTime(false);
      }
    }
  };

  useEffect(() => {
    if (bookedDate) {
      handleSelect();
    }
  }, [bookedDate]);

  const handleTimeSlot = () => {
    if (!timeSlot) {
      setStartTime(null);
      setEndTime(null);
    }
    setOpen(false);
  };

  const handleSetTimeSlot = () => {
    if (!bookedDate) return;
    // Create a new Date object from the date string
    // Extract the year, month, and day from the base date
    const year = bookedDate.getFullYear();
    const month = bookedDate.getMonth(); // zero-based index for months
    const day = bookedDate.getDate();
    if (!checkin) {
      setCheckin(new Date(`${month + 1}/${day}/${year} ${startTime}`));
      setOpen(false);
      setCurrentTab("end");
    } else {
      setCheckout(new Date(`${month + 1}/${day}/${year} ${endTime}`));
      setOpen(false);
      setCurrentTab("start");
    }
  };

  useEffect(() => {
    if (roomBookingDetails) {
      if (checkin === null) {
        setCurrentTab("start");
      } else {
        setCurrentTab("end");
      }
    }
  }, [checkin, checkout, roomBookingDetails]);

  const processDates = (dateArray: any[] | undefined): Date[] => {
    // Return an empty array if the input is empty or not provided
    if (!dateArray || dateArray.length === 0) {
      return [];
    }

    // Function to parse the date string and create a new Date object
    const parseDate = (dateStr: string): Date => {
      const [year, month, day] = dateStr.split("-").map(Number);
      // Subtract 1 from month because JavaScript Date months are 0-indexed
      return new Date(year, month - 1, day);
    };

    // Extract dates from input array and convert them to Date objects
    return dateArray.map((item) => parseDate(item.date));
  };

  const fetchCompletedData = async (id: number) => {
    try {
      const completed_orders = await axios.get(
        `${site_url_value.value}/wp-json/v2/completed-orders/${id}`
      );
      const date = processDates(completed_orders.data);
      setPaidDate(date);
    } catch (error) {}
  };

  const fetchPartialData = async (id: number) => {
    try {
      const completed_orders = await axios.get(
        `${site_url_value.value}/wp-json/v2/partial-orders/${id}`
      );
      const date = processDates(completed_orders.data);
      setPartialDate(date);
    } catch (error) {}
  };

  useEffect(() => {
    if (roomBookingDetails) {
      fetchCompletedData(Number(roomBookingDetails.id));
      fetchPartialData(Number(roomBookingDetails.id));
    }
  }, [roomBookingDetails]);

  interface DaysOfWeek {
    [key: string]: number;
  }

  function remainingDaysInRange(
    startDay: keyof DaysOfWeek,
    endDay: keyof DaysOfWeek
  ): number[] {
    const daysOfWeek: DaysOfWeek = {
      MO: 1,
      TU: 2,
      WE: 3,
      TH: 4,
      FR: 5,
      SA: 6,
      SU: 0,
    };

    const startIndex = daysOfWeek[startDay];
    const endIndex = daysOfWeek[endDay];
    const allDays = Object.values(daysOfWeek);

    if (startIndex !== undefined && endIndex !== undefined) {
      if (startIndex <= endIndex) {
        return allDays.filter((day) => day > endIndex || day < startIndex);
      } else {
        return allDays.filter((day) => day > endIndex && day < startIndex);
      }
    } else {
      throw new Error("Invalid day abbreviation");
    }
  }

  useEffect(() => {
    // Disable all elements with class 'myClass'
    $(".custom-date-booked").prop("disabled", true);
  }, [paidDate]);

  const [prevDate, setPrevDate] = useState<any>();
  const handleSelectDate: SelectSingleEventHandler = (date) => {
    if (date !== undefined) {
      setPrevDate(date);
      setBookedDate(date);
    } else {
      setBookedDate(new Date(prevDate));
    }
  };

  useEffect(() => {
    if (roomBookingDetails) {
      setStartTime(null);
      setEndTime(null);
      setPartialDate(undefined);
      setPaidDate(undefined);
    }
  }, [roomBookingDetails]);

  return (
    <>
      {roomBookingDetails ? (
        <Card className={containerStyles}>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <Popover open={open} onOpenChange={handleTimeSlot}>
              <PopoverTrigger asChild>
                <div className="w-full"></div>
              </PopoverTrigger>

              <PopoverContent className="max-w-md space-y-6 p-0 w-[300px] shadow-2xl">
                {loadingTime ? (
                  <LineWave
                    visible={true}
                    height="100"
                    width="100"
                    color="#4fa94d"
                    ariaLabel="line-wave-loading"
                    wrapperStyle={{}}
                    wrapperClass="justify-center items-center h-[200px] bg-gray-100"
                    firstLineColor=""
                    middleLineColor=""
                    lastLineColor=""
                  />
                ) : (
                  <>
                    <div className="border-b p-4 flex items-center justify-between">
                      <Button
                        variant="default"
                        className="text-md font-bold text-blue-500 bg-transparent hover:bg-transparent"
                        onClick={() => setOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="text-md font-bold bg-transparent hover:bg-transparent text-blue-500 "
                        // disabled={startTime && endTime ? false : true}
                        onClick={() => handleSetTimeSlot()}
                      >
                        Set
                      </Button>
                    </div>
                    <Tabs
                      defaultValue={currentTab}
                      className="w-full p-4 !mt-0"
                    >
                      <TabsList className="grid w-full grid-cols-2 h-auto !bg-primary">
                        {!checkin ? (
                          <TabsTrigger
                            value="start"
                            className="flex flex-col justify-start items-start font-bold !text-white !bg-primary"
                            onClick={() => setCurrentTab("start")}
                          >
                            <span>Check In</span>
                            <span>
                              {startTime ? startTime : "Please select"}
                            </span>
                          </TabsTrigger>
                        ) : (
                          <TabsTrigger
                            value="end"
                            className="flex flex-col justify-start items-start font-bold !text-white !bg-primary"
                            onClick={() => setCurrentTab("end")}
                          >
                            <span>Check Out</span>
                            <span>{endTime ? endTime : "Please Select"}</span>
                          </TabsTrigger>
                        )}
                      </TabsList>

                      <TabsContent value="start">
                        <div className="grid grid-cols-3 gap-x-2 gap-y-4 pt-8   h-[400px] overflow-y-auto">
                          {operatingHours &&
                            operatingHours.map((item: TimeSlot, index: any) => (
                              <Button
                                type="button"
                                key={index}
                                className={`font-base hover:bg-primary hover:text-white hover:rounded-md px-2 py-1 transition-all cursor-pointer ${
                                  startTime && startTime === item.time
                                    ? "bg-primary text-white"
                                    : "text-black bg-white"
                                }`}
                                onClick={() => {
                                  setStartTime(item.time);
                                }}
                                disabled={
                                  item.status === "disabled" ? true : false
                                }
                              >
                                {item.time}
                              </Button>
                            ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="end">
                        <div className="grid grid-cols-3 gap-x-2 gap-y-4 pt-8   h-[400px] overflow-y-auto">
                          {operatingHours &&
                            operatingHours.map(
                              (item: TimeSlot, index: number) => (
                                <Button
                                  type="button"
                                  key={index}
                                  className={`font-base hover:bg-primary hover:text-white hover:rounded-md px-2 py-1 transition-all cursor-pointer ${
                                    endTime && endTime === item.time
                                      ? "bg-primary text-white"
                                      : "text-black bg-white"
                                  }`}
                                  onClick={() => {
                                    setEndTime(item.time);
                                  }}
                                  disabled={
                                    item.status === "disabled" ? true : false
                                  }
                                >
                                  {item.time}
                                </Button>
                              )
                            )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </PopoverContent>
            </Popover>
            {partialDate && paidDate ? (
              <Calendar
                mode="single"
                modifiers={{
                  disabled: [
                    {
                      before: new Date(), // Disables days before today
                    },
                    {
                      dayOfWeek: remainingDaysInRange(
                        String(roomBookingDetails?.operating_days_starts),
                        String(roomBookingDetails?.operating_days_ends)
                      ), // Disables weekends (Sunday=0, Saturday=6)
                    },
                  ],

                  // @ts-ignore
                  booked: paidDate,
                  // @ts-ignore
                  partial: partialDate, // Add partial modifier
                }}
                modifiersClassNames={{
                  selected: "custom-date-selected",
                  today: "custom-date-today",
                  booked: "custom-date-booked",
                  disabled: "custom-date-disabled",
                  partial: "custom-date-partial",
                }}
                // @ts-ignore
                selected={bookedDate}
                onSelect={handleSelectDate}
                className="rounded-md w-full room-description room-description-calendar"
              />
            ) : (
              <Skeleton className="bg-gray-200 w-full h-[290.195px]" />
            )}
          </CardContent>
          <CardFooter>
            <div className="flex justify-start item-center gap-4 flex-wrap">
              {statuses.map((status, index) => {
                return (
                  <span
                    key={index}
                    className={`text-sm text-secondary space-x-2 pl-6 relative after:content-[''] after:absolute after:left-0 after:top-0 after:bottom-0  after:w-5 after:h-5 after:rounded-full ${status.class}`}
                  >
                    {status.name}
                  </span>
                );
              })}
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Card className={containerStyles}>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
          </CardHeader>
          <CardContent>
            {
              <Calendar
                mode="single"
                modifiers={{
                  disabled: [
                    {
                      before: new Date(), // Disables days before today
                    },
                  ],
                }}
                modifiersClassNames={{
                  selected: "custom-date-selected",
                  today: "custom-date-today",
                  booked: "custom-date-booked",
                  disabled: "custom-date-disabled",
                  partial: "custom-date-partial",
                }}
                className="rounded-md w-full room-description room-description-calendar"
              />
            }
          </CardContent>
          <CardFooter>
            <div className="flex justify-start item-center gap-4 flex-wrap">
              {statuses.map((status, index) => {
                return (
                  <span
                    key={index}
                    className={`text-sm text-secondary space-x-2 pl-6 relative after:content-[''] after:absolute after:left-0 after:top-0 after:bottom-0  after:w-5 after:h-5 after:rounded-full ${status.class}`}
                  >
                    {status.name}
                  </span>
                );
              })}
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
};

export default CalendarBooking;
