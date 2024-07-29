import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { parse, addDays, isWithinInterval, isBefore, isAfter, format, set, addHours, setMinutes, setHours } from 'date-fns';

interface TimeSlot {
  time: string;
  status: "enabled" | "disabled";
}

interface TimeRange {
  start: string;
  end: string;
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formattedNumber = (rate: any) => {
  const formattedNumber = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(rate);

  return formattedNumber.replace("₱", "₱ ");
};

export const convertDate = (originalDateStr: string): string => {
  // Extract the date and time components from the input string
  const [datePart, timePart] = originalDateStr.split(" at ");
  const [month, day, year] = datePart.split(" ");
  const [time, period] = timePart.split(" ");

  // Convert month name to number
  const monthNames = [
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
  const monthIndex = monthNames.indexOf(month) + 1;

  // Construct a date object
  const [hours, minutes, seconds] = time.split(":").map(Number);
  const adjustedHours =
    period === "PM" && hours !== 12
      ? hours + 12
      : period === "AM" && hours === 12
      ? 0
      : hours;

  const originalDate = new Date(
    parseInt(year),
    monthIndex - 1,
    parseInt(day),
    adjustedHours,
    minutes,
    seconds
  );

  // Format the date components
  const formattedYear = originalDate.getFullYear().toString().substr(2);
  const formattedMonth = (originalDate.getMonth() + 1)
    .toString()
    .padStart(2, "0");
  const formattedDay = originalDate.getDate().toString().padStart(2, "0");
  const formattedMinutes = originalDate
    .getMinutes()
    .toString()
    .padStart(2, "0");

  // Convert 24-hour time to 12-hour format
  let formattedHours = originalDate.getHours();
  const formattedPeriod = formattedHours >= 12 ? "pm" : "am";

  formattedHours = formattedHours % 12;
  formattedHours = formattedHours ? formattedHours : 12; // the hour '0' should be '12'
  const formatted12Hour = formattedHours.toString().padStart(2, "0");

  // Construct the formatted date string
  const formattedDate = `${formattedDay}-${formattedMonth}-${formattedYear} ${formatted12Hour}:${formattedMinutes} ${formattedPeriod}`;

  return formattedDate;
};

export const parseCustomDate = (dateStr: string): Date => {
  const [datePart, timePart] = dateStr.split(" at ");
  const [month, day, year] = datePart.split(" ");
  const [time, period] = timePart.split(" ");

  const monthNames = [
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
  const monthIndex = monthNames.indexOf(month) + 1;

  const [hours, minutes, seconds] = time.split(":").map(Number);
  const adjustedHours =
    period === "PM" && hours !== 12
      ? hours + 12
      : period === "AM" && hours === 12
      ? 0
      : hours;

  return new Date(
    parseInt(year),
    monthIndex - 1,
    parseInt(day),
    adjustedHours,
    minutes,
    seconds
  );
};

export const calculateTimeDifference = (
  checkin: string,
  checkout: string
): { difference: string; hours: number; minutes: number } => {
  const startDate: Date = parseCustomDate(checkin);
  const endDate: Date = parseCustomDate(checkout);

  const timeDifferenceMs: number = endDate.getTime() - startDate.getTime();

  const hours: number = Math.floor(timeDifferenceMs / (1000 * 60 * 60));
  const minutes: number = Math.floor(
    (timeDifferenceMs % (1000 * 60 * 60)) / (1000 * 60)
  );

  let formattedDifference: string;

  if (hours > 0) {
    formattedDifference = `${hours} hr${hours !== 1 ? "s" : ""}`;
    if (minutes > 0) {
      formattedDifference += ` ${minutes} min${minutes !== 1 ? "s" : ""}`;
    }
  } else if (minutes > 0) {
    formattedDifference = `${minutes} min${minutes !== 1 ? "s" : ""}`;
  } else {
    formattedDifference = "Less than a minute";
  }

  return {
    difference: formattedDifference,
    hours: hours,
    minutes: minutes,
  };
};

// export const calculateTotalBooking = (
//   checkin: string,
//   checkout: string,
//   booking_type: string,
//   rate: number
// ): number => {
//   const start: Date = parseCustomDate(checkin);
//   const end: Date = parseCustomDate(checkout);
//   const diffInMs: number = end.getTime() - start.getTime();

//   if (booking_type === "hourly") {
//     const diffInHours: number = diffInMs / (1000 * 60 * 60);
//     const totalCost: number = diffInHours * rate;
//     return totalCost;
//   } else {
//     const diffInDays: number = diffInMs / (1000 * 60 * 60 * 24);
//     const totalCost: number = diffInDays * rate;
//     return totalCost;
//   }
// };

export const calculateTotalBooking = (
  totalTime: number, // assuming totalTime is directly provided as hours
  booking_type: string,
  rate: number
): number => {
  if (booking_type === "hourly") {
    const totalCost: number = totalTime * rate;
    return totalCost;
  } else {
    // Assuming totalTime represents hours here, convert it to days
    const totalCost: number = totalTime * rate;
    return totalCost;
  }
};

export function calculateAmountToPay(
  total_amount: number,
  hoursInWholeDay: number,
  hoursOccupied: number
): number {
  // Calculate hourly rate
  const hourlyRate = total_amount / hoursInWholeDay;

  // Calculate amount to pay
  const amountToPay = hourlyRate * hoursOccupied;

  return amountToPay;
}

export const calculateTaxAmount = (
  originalCost: any,
  vatPercentage: any
): number => {
  const taxAmountAdd = (originalCost * vatPercentage) / 100;
  return taxAmountAdd;
};

export const formatCurrency = (amount: number) => {
  const formatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  });
  return formatter.format(amount);
};

export const padNumber = (number: number, length: number) => {
  return String(number).padStart(length, '0');
}

export const parseTime = (time: string) => {
  const [hour, minutePart] = time.split(":");
  const [minutes, period] = minutePart.split(" ");
  let hours = parseInt(hour);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + parseInt(minutes);
};

export const generateOperatingHours = (
  startStr: string,
  endStr: string,
  disabledTimes: TimeRange[],
  current_date: string
): TimeSlot[] => {
  const parseTime = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
  };
  
  const createDateTime = (baseDate: string, timeStr: string) => {
    const { hours, minutes } = parseTime(timeStr);
    const date = parse(baseDate, 'MMMM d, yyyy', new Date());
    return set(date, { hours, minutes });
  };

  // const baseDate = "1970-01-01";
  const startTime = createDateTime(current_date, startStr);
  let endTime = createDateTime(current_date, endStr);


  // Handle cases where the end time is on the next day
  if (endTime <= startTime) {
    endTime.setDate(endTime.getDate() + 1);
  }

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new Error("Invalid time format. Use 'h:mm AM/PM'.");
  }

  // Parse disabled times into Date objects
  const parsedDisabledTimes = disabledTimes.map((timeRange) => ({
    start: createDateTime(current_date, timeRange.start),
    end: createDateTime(current_date, timeRange.end),
  }));

  const timeList: TimeSlot[] = [];
  let currentTime = new Date(startTime);

  // Loop to create time intervals with a 30-minute step
  while (currentTime <= endTime) {
   

    const now = new Date();
    const startTime = new Date();
    startTime.setHours(0, 0, 0, 0); // Start at midnight
    const endTime = new Date();
    endTime.setHours(23, 30, 0, 0); // End at 11:30 PM
    
    const isDisabled = parsedDisabledTimes.some((timeRange) => {
      return (currentTime >= timeRange.start && currentTime < timeRange.end) ;
    });

    timeList.push({
      time: currentTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      status: (isDisabled || (now.getTime() > currentTime.getTime())) ? "disabled" : "enabled",
    });

    // Increment the current time by 30 minutes
    currentTime.setMinutes(currentTime.getMinutes() + 30);
  }

  return timeList;
};



export const computeTotalWorkingHours = (
  startDateTime: Date, 
  endDateTime: Date, 
  operatingHoursStart: string, 
  operatingHoursEnd: string,
  operatingDaysStarts: string, 
  operatingDaysEnds: string 
) => {
 
   // Parse the check-in and check-out times
  //  const startDateTime = parse(checkin, inputTimeFormat, new Date());
  //  const endDateTime = parse(checkout, inputTimeFormat, new Date());

  // const startDateTime = new Date('2024-06-24T08:00:00'); // June 24, 2024, 1:00 PM
  // const endDateTime = new Date('2024-06-25T15:30:00'); // June 28, 2024, 5:00 PM


  const getDate = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // Month is zero-indexed
      const day = date.getDate();
      return `${year}-${month}-${day}`;
  };

  const calculateTotalWorkingHours = (
    start: Date, 
    end: Date, 
    opHoursStart: string, 
    opHoursEnd: string, 
    opDaysStart: string, 
    opDaysEnd: string
  ): number => {
    const convertTo24HourFormat = (time: string): number => {
      let [hourMin, period] = time.split(' ');
      let [hours, minutes] = hourMin.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours + (minutes / 60);
    };


    const getOperatingDays = (start: string, end: string): string[] => {
      const days = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
      const startIndex = days.indexOf(start);
      const endIndex = days.indexOf(end);
      return days.slice(startIndex, endIndex + 1);
    };

    const workHoursStart = convertTo24HourFormat(opHoursStart);
    const workHoursEnd = convertTo24HourFormat(opHoursEnd);
    const operatingDays = getOperatingDays(opDaysStart, opDaysEnd);

    let totalHours = 0;
    let current = new Date(start);

    while (current <= end) {
      const currentDay = current.toLocaleString('en-us', { weekday: 'short' }).toUpperCase().slice(0, 2);

      if (operatingDays.includes(currentDay)) {
        const dayStart = new Date(current);
        const dayEnd = new Date(current);

        dayStart.setHours(Math.max(workHoursStart, current.getHours()), current.getMinutes(), 0, 0);
        dayEnd.setHours(Math.min(workHoursEnd, end.getHours()), end.getMinutes(), 0, 0);

        if (currentDay === operatingDays[0] && current < dayStart) {
          current = dayStart;
        }


        

        if(getDate(end) !== getDate(dayEnd)) {
          dayEnd.setHours(Math.max(workHoursEnd, end.getHours()), 0, 0, 0);
        }

        if (current <= end) {
          let hours = (dayEnd.getTime() - current.getTime()) / (1000 * 60 * 60);
      
          if (hours > 0) totalHours += hours;
        }

        

      }

      current.setDate(current.getDate() + 1);
      current.setHours(workHoursStart, 0, 0, 0);
    }

    return totalHours;
  };

  return calculateTotalWorkingHours(
    startDateTime, 
    endDateTime, 
    operatingHoursStart, 
    operatingHoursEnd, 
    operatingDaysStarts, 
    operatingDaysEnds
  );

}

export const DateCounter = (checkin: string, checkout: string, operatingDaysStarts: string, operatingDaysEnds: string) => {
  const checkinDate = parse(checkin, "MMMM dd, yyyy 'at' hh:mm:ss a", new Date());
  const checkoutDate = parse(checkout, "MMMM dd, yyyy 'at' hh:mm:ss a", new Date());

  const startDay = operatingDaysStarts.toUpperCase();
  const endDay = operatingDaysEnds.toUpperCase();
  const startDayIndex = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"].indexOf(startDay);
  const endDayIndex = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"].indexOf(endDay);

  let currentDate = checkinDate;
  let daysDifference = 0;

  while (isBefore(currentDate, checkoutDate) || isWithinInterval(currentDate, { start: checkinDate, end: checkoutDate })) {
    const currentDayIndex = currentDate.getDay(); // 0 (Sunday) to 6 (Saturday)

    if (
      (startDayIndex <= endDayIndex && currentDayIndex >= startDayIndex && currentDayIndex <= endDayIndex) ||
      (startDayIndex > endDayIndex && (currentDayIndex >= startDayIndex || currentDayIndex <= endDayIndex))
    ) {
      daysDifference++;
    }

    currentDate = addDays(currentDate, 1);
  }

  return daysDifference;
};