const API_URL = "https://api.castus.tv/ccs/v1/schedule/acmi/";
const CHANNELS = [
  {
    id: "ch1",
    name: "Public",
    icon: "https://acmi.tv/wp-content/uploads/2021/10/tv_icon.png",
    channels: [
      {
        provider: "Comcast",
        channel: "8",
      },
      {
        provider: "RCN",
        channel: "29",
      },
      {
        provider: "RCN (HD)",
        channel: "629",
      },
      {
        provider: "Verizon",
        channel: "31",
      },
    ],
  },
  {
    id: "ch2",
    name: "Education",
    icon: "https://acmi.tv/wp-content/uploads/2021/10/bookicon.png",
    channels: [
      {
        provider: "Comcast",
        channel: "9",
      },
      {
        provider: "RCN",
        channel: "13",
      },
      {
        provider: "RCN (HD)",
        channel: "613",
      },
      {
        provider: "Verizon",
        channel: "24",
      },
    ],
  },
  {
    id: "ch3",
    name: "Government",
    icon: "https://acmi.tv/wp-content/uploads/2021/10/icon_government.png",
    channels: [
      {
        provider: "Comcast",
        channel: "22",
      },
      {
        provider: "RCN",
        channel: "15",
      },
      {
        provider: "RCN (HD)",
        channel: "614",
      },
      {
        provider: "Verizon",
        channel: "26",
      },
    ],
  },
];

const SLOT_WIDTH = 240;
const WINDOW_SECONDS = 6 * 60 * 60; // 6 Hours
const MINUTES_PER_SLOT = 30;
const PIXELS_PER_MINUTE = SLOT_WIDTH / MINUTES_PER_SLOT;

const GRID = document.getElementById("scheduleGrid");

let selectedDate = new Date();

async function loadSchedule(date) {
  try {
    const responses = await Promise.all(
      CHANNELS.map(async (channel) => {
        const response = await fetch(`${API_URL}${channel.id}`);

        const data = await response.json();

        return {
          channel,
          items: data.items || [],
        };
      }),
    );

    renderGrid(responses, date);
  } catch (error) {
    console.error(error);
  }
}

function renderGrid(CASTUS_DATA, date) {
  GRID.innerHTML = `
      <div class="static-container" id="staticContainer"></div>
      <div class="scroll-container" id="scrollContainer"></div>
    `;

  const now = new Date();
  const timelineStart = new Date(date);

  if (date.toISOString().split("T")[0] === now.toISOString().split("T")[0]) {
    timelineStart.setHours(now.getHours());
    timelineStart.setMinutes(Math.floor(now.getMinutes() / 30) * 30);
  } else {
    timelineStart.setHours(0);
    timelineStart.setMinutes(0);
  }

  const timelineStartUnix = Math.floor(timelineStart.getTime() / 1000);
  const timelineEndUnix = timelineStartUnix + WINDOW_SECONDS;

  const staticContainer = document.getElementById("staticContainer");
  const scrollContainer = document.getElementById("scrollContainer");
  staticContainer.appendChild(createDateSelect());
  scrollContainer.appendChild(createTimeline(timelineStart));

  const channelHeaderWrapper = document.createElement("div");
  channelHeaderWrapper.className = "channel-header-wrapper";

  const channelContentWrapper = document.createElement("div");
  channelContentWrapper.className = "channel-content-wrapper";

  CASTUS_DATA.forEach((channel) => {
    channelHeaderWrapper.appendChild(createChannelHeader(channel.channel));

    channelContentWrapper.appendChild(
      createChannelContent(
        channel.channel,
        channel.items,
        timelineStartUnix,
        timelineEndUnix,
      ),
    );
  });

  staticContainer.appendChild(channelHeaderWrapper);
  scrollContainer.appendChild(channelContentWrapper);
}

function createChannelHeader(channelData) {
  const channelHeader = document.createElement("div");
  channelHeader.className = `channel-header ${channelData.name.toLowerCase()}`;

  const icon = document.createElement("span");
  icon.className = `channel-icon ${channelData.name.toLowerCase()}`;
  icon.innerHTML = `<img src=${channelData.icon} alt="${channelData.name} icon" />`;

  channelHeader.appendChild(icon);

  const label = document.createElement("span");
  label.className = `channel-label ${channelData.name.toLowerCase()}`;
  label.textContent = channelData.name.toUpperCase();

  channelHeader.appendChild(label);

  const channelInfo = document.createElement("span");
  channelInfo.className = `channel-info ${channelData.name.toLowerCase()}`;
  channelData.channels.forEach((provider) => {
    channelInfo.innerHTML += `
        <div class="channel-info-item">
          <span class="channel-info-label">${provider.provider}:</span>
          <span class="channel-info-value">CH. ${provider.channel}</span>
        </div>
      `;
  });

  channelHeader.appendChild(channelInfo);

  return channelHeader;
}

function createChannelContent(
  channelData,
  items,
  timelineStartUnix,
  timelineEndUnix,
) {
  const content = document.createElement("div");
  content.className = `channel-content ${channelData.name.toLowerCase()} ${channelData.name.toLowerCase()}-content`;
  content.style.width = `${(WINDOW_SECONDS / 60) * PIXELS_PER_MINUTE}px`;

  const segments = [];

  for (const item of items) {
    const start = item.start_unix.unix;
    const end = item.end_unix.unix;
    const nowUnix = Math.floor(Date.now() / 1000);

    const displayStart = floorTo15(start);
    const displayEnd = ceilTo15(end);

    const clippedStart = Math.max(displayStart, timelineStartUnix);
    const clippedEnd = Math.min(displayEnd, timelineEndUnix);

    if (clippedEnd <= clippedStart) continue;

    const durationMinutes = (clippedEnd - clippedStart) / 60;
    const width = durationMinutes * PIXELS_PER_MINUTE;
    const left = ((clippedStart - timelineStartUnix) / 60) * PIXELS_PER_MINUTE;

    const seg = {
      scheduled: item.announce,
      title: item.announce
        ? item.metadata.title
          ? item.metadata.title
          : item.name
            ? item.name
            : "Local Announcements"
        : "Local Announcements",
      description: item.metadata.description || "",
      program: item.metadata.program || "",
      start,
      end,
      displayStart: clippedStart,
      displayEnd: clippedEnd,
      duration_minutes: durationMinutes,
      width,
      left,
      isLive: start <= nowUnix && end > nowUnix,
      isToday: end >= timelineStartUnix && start <= timelineEndUnix,
    };

    if (seg.title.includes(".mp4")) {
      seg.title = seg.title.split("/").pop().split(".mp4")[0];
    }

    // if (
    //   segments.length > 0 &&
    //   !segments[segments.length - 1].scheduled &&
    //   !seg.scheduled
    // ) {
    //   seg.start = segments[segments.length - 1].start;
    //   segments.pop();
    // }

    if (seg.isToday) {
      segments.push(seg);
    }

    if (seg.isToday && segments.length > 1 && seg.duration_minutes <= 15) {
      segments[segments.length - 2].end = seg.end;
      segments.pop();
    } // TODO Add logic to merge segments of same program that are less than 10 minutes in length
  }

  segments.forEach((seg) => {
    const startDate = new Date(seg.start * 1000);
    const block = document.createElement("div");

    block.className = `program-block ${seg.isLive && seg.scheduled ? "live" : ""}`;
    block.innerHTML = `

            <div class="program-title">
              ${seg.title}
            </div>
            <div class="program-time">
              ${startDate.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
        `;

    block.style.width = `${seg.width}px`;
    block.style.left = `${seg.left}px`;

    content.appendChild(block);
  });

  return content;
}

function createDateSelect() {
  const dateSelect = document.createElement("select");
  dateSelect.id = "dateSelect";
  dateSelect.className = "date-select date top-row";
  dateSelect.innerHTML = "";

  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);

    date.setDate(today.getDate() + i);

    const option = document.createElement("option");

    option.value = date;

    option.textContent = date.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    dateSelect.appendChild(option);
  }

  dateSelect.value = selectedDate;

  // DATE SELECTION FUNCTIONALITY DISABLED FOR NOW

  // dateSelect.addEventListener("change", () => {
  //   selectedDate = new Date(dateSelect.value);
  //   loadSchedule(selectedDate);
  // });

  return dateSelect;
}

function createTimeline(timelineStart) {
  const totalSlots = WINDOW_SECONDS / (MINUTES_PER_SLOT * 60);
  const airTimes = document.createElement("div");
  airTimes.className = "air-times top-row";
  airTimes.style.width = `${totalSlots * SLOT_WIDTH}px`;
  airTimes.innerHTML = "";

  for (let hour = 0; hour < totalSlots; hour++) {
    const time = new Date(timelineStart);
    time.setMinutes(timelineStart.getMinutes() + hour * MINUTES_PER_SLOT);

    const timeDiv = document.createElement("div");
    timeDiv.className = "time-slot";
    timeDiv.style.left = `${hour * SLOT_WIDTH}px`;
    timeDiv.style.width = `${SLOT_WIDTH}px`;

    timeDiv.innerHTML = `
      <div class="time-label">
        ${time.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}
      </div>
    `;
    airTimes.appendChild(timeDiv);
  }

  return airTimes;
}

const FIFTEEN_MINUTES = 15 * 60;

function roundToNearest15(unixTime) {
  return Math.round(unixTime / FIFTEEN_MINUTES) * FIFTEEN_MINUTES;
}

function floorTo15(unixTime) {
  return Math.floor(unixTime / FIFTEEN_MINUTES) * FIFTEEN_MINUTES;
}

function ceilTo15(unixTime) {
  return Math.ceil(unixTime / FIFTEEN_MINUTES) * FIFTEEN_MINUTES;
}

loadSchedule(selectedDate);
