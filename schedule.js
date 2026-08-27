const API_URL = "https://api.castus.tv/ccs/v1/schedule/acmi/";
const CHANNELS = [{
        id: "ch1",
        name: "Public",
        icon: "https://acmi.tv/wp-content/uploads/2021/10/tv_icon.png",
        channels: [{
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
        embed: `
        <iframe
          src="https://cloud.castus.tv/vod/acmi/embed/672a4a4c4305ae377e9ef892?page=HOME&type=live&embedID=672a4a4c4305ae377e9ef892"
          title="CASTUS Embedded Video Player"
          id="castus-embed"
          allowtransparency="true"
          frameborder="0"
          sandbox="allow-same-origin allow-forms allow-scripts"
          scrolling="auto"
          allowfullscreen
          style="border:none;border-radius:4px;"
        ></iframe>`
    },
    {
        id: "ch2",
        name: "Education",
        icon: "https://acmi.tv/wp-content/uploads/2021/10/bookicon.png",
        channels: [{
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
        embed: `
        <iframe
          src="https://cloud.castus.tv/vod/acmi/embed/672a4a7b4305ae377e9ef89a?page=HOME&type=live&embedID=672a4a7b4305ae377e9ef89a"
          title="CASTUS Embedded Video Player"
          id="castus-embed"
          allowtransparency="true"
          frameborder="0"
          sandbox="allow-same-origin allow-forms allow-scripts"
          scrolling="auto"
          allowfullscreen
          style="border:none;border-radius:4px;"
        ></iframe>`
    },
    {
        id: "ch3",
        name: "Government",
        icon: "https://acmi.tv/wp-content/uploads/2021/10/icon_government.png",
        channels: [{
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
        embed: `
        <iframe
          src="https://cloud.castus.tv/vod/acmi/embed/672a4a9a4305ae377e9ef8a5?page=HOME&type=live&embedID=672a4a9a4305ae377e9ef8a5"
          title="CASTUS Embedded Video Player"
          id="castus-embed"
          allowtransparency="true"
          frameborder="0"
          sandbox="allow-same-origin allow-forms allow-scripts"
          scrolling="auto"
          allowfullscreen
          style="border:none;border-radius:4px;"
        ></iframe>`
    },
];

const SLOT_WIDTH = 240;
const WINDOW_SECONDS = 12 * 60 * 60; // 6 Hours
const MINUTES_PER_SLOT = 30;
const PIXELS_PER_MINUTE = SLOT_WIDTH / MINUTES_PER_SLOT;

const GRID = document.getElementById("scheduleGrid");

let selectedDate = new Date();

function getTimelineWidth() {
    return (WINDOW_SECONDS / 60) * PIXELS_PER_MINUTE;
}

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
            })
        );

        scheduleData = responses;

        renderGrid(responses, date);
        renderEmbed(CHANNELS[0]);
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
    staticContainer.appendChild(createDateSelect(date));
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

    const watchButton = document.createElement("div");
    watchButton.className = `watch-button ${channelData.name.toLowerCase()}`;
    watchButton.addEventListener("click", () => {
        renderEmbed(channelData);
    });
    watchButton.textContent = "Watch";
    channelHeader.appendChild(watchButton);

    return channelHeader;
}

function createChannelContent(
    channelData,
    items,
    timelineStartUnix,
    timelineEndUnix,
) {
    const content = document.createElement("div");

    content.className =
        `channel-content ${channelData.name.toLowerCase()} ${channelData.name.toLowerCase()}-content`;

    content.style.width = `${getTimelineWidth()}px`;

    const segments = [];

    for (const item of items) {

        const start = item.start_unix.unix;
        const end = item.end_unix.unix;

        // Ignore anything outside our timeline
        if (end <= timelineStartUnix || start >= timelineEndUnix) {
            continue;
        }

        // Clip to visible timeline
        const clippedStart = Math.max(start, timelineStartUnix);
        const clippedEnd = Math.min(end, timelineEndUnix);

        if (clippedEnd <= clippedStart) {
            continue;
        }

        const nowUnix = Math.floor(Date.now() / 1000);

        let title = item.opath.includes("CBB/") ? "Local Announcements" : item.metadata?.title || item.name;

        if (title.includes(".mp4")) { //mov, mpg, vob, avi, m4v, mkv
            title = title.split("/").pop().split(".mp4")[0];
        }

        segments.push({
            scheduled: item.announce,
            title,
            description: item.metadata?.description || "",
            program: item.metadata?.program || "",

            start,
            end,

            displayStart: clippedStart,
            displayEnd: clippedEnd,

            isLive: start <= nowUnix && end > nowUnix,
            isToday: end >= timelineStartUnix && start <= timelineEndUnix
        });
    }

    /*
     * Merge very short segments BEFORE calculating their
     * pixel positions.
     */
    for (let i = segments.length - 1; i > 0; i--) {

        const current = segments[i];

        if (
            current.end - current.start <= 5 * 60
        ) {
            segments[i - 1].end = current.end;
            segments.splice(i, 1);
        }
    }

    /*
     * Now calculate positions from the final segment times.
     */
    segments.forEach((seg) => {

        const clippedStart =
            Math.max(seg.start, timelineStartUnix);

        const clippedEnd =
            Math.min(seg.end, timelineEndUnix);

        if (clippedEnd <= clippedStart) {
            return;
        }

        const left =
            ((clippedStart - timelineStartUnix) / 60) *
            PIXELS_PER_MINUTE;

        const width =
            ((clippedEnd - clippedStart) / 60) *
            PIXELS_PER_MINUTE;

        const block = document.createElement("div");

        block.className =
            `program-block ${seg.isLive && seg.scheduled ? "live" : ""}`;

        block.style.left = `${left}px`;
        block.style.width = `${width}px`;

        const startDate = new Date(seg.start * 1000);

        block.innerHTML = `
            <div class="program-title">
                ${seg.title}
            </div>

            <div class="program-time">
                ${startDate.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit"
                })}
            </div>
        `;

        content.appendChild(block);
    });

    return content;
}

function createDateSelect(selectedDate) {
    const dateSelect = document.createElement("select");

    dateSelect.id = "dateSelect";
    dateSelect.className = "date-select date top-row";

    const today = new Date();

    // Normalize today to midnight
    today.setHours(0, 0, 0, 0);

    // Use the supplied date, or today
    const currentSelectedDate = selectedDate ?
        new Date(selectedDate) :
        new Date(today);

    currentSelectedDate.setHours(0, 0, 0, 0);

    // Sunday = 0, Monday = 1, ..., Saturday = 6
    const daysUntilSaturday = 6 - today.getDay();

    // Create options from today through Saturday
    for (let i = 0; i <= daysUntilSaturday; i++) {

        const date = new Date(today);

        date.setDate(today.getDate() + i);

        // YYYY-MM-DD
        const value = date.toISOString().split("T")[0];

        const option = document.createElement("option");

        option.value = value;

        option.textContent = date.toLocaleDateString([], {
            weekday: "long",
            month: "long",
            day: "numeric",
        });

        dateSelect.appendChild(option);
    }

    // Set the currently selected date
    const selectedValue =
        currentSelectedDate.toISOString().split("T")[0];

    dateSelect.value = selectedValue;

    dateSelect.addEventListener("change", () => {

        const [year, month, day] =
        dateSelect.value.split("-").map(Number);

        const newSelectedDate =
            new Date(year, month - 1, day);

        selectedDate = newSelectedDate;

        loadSchedule(newSelectedDate);
    });

    return dateSelect;
}

function createTimeline(timelineStart) {
    const totalSlots = WINDOW_SECONDS / (MINUTES_PER_SLOT * 60);
    const airTimes = document.createElement("div");
    airTimes.className = "air-times top-row";
    airTimes.style.width = `${getTimelineWidth()}px`;
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

const FIVE_MINUTES = 5 * 60;

function roundToNearest5(unixTime) {
    return Math.round(unixTime / FIVE_MINUTES) * FIVE_MINUTES;
}

function floorTo5(unixTime) {
    return Math.floor(unixTime / FIVE_MINUTES) * FIVE_MINUTES;
}

function ceilTo5(unixTime) {
    return Math.ceil(unixTime / FIVE_MINUTES) * FIVE_MINUTES;
}

function renderEmbed(channelData) {

    const embedContainer =
        document.getElementById("embedContainer");

    embedContainer.innerHTML = channelData.embed;

    updateCurrentlyWatching(channelData);
}

function updateCurrentlyWatching(channelData) {

    const nowUnix = Math.floor(Date.now() / 1000);

    // Find the currently airing item
    const currentItem = scheduleData
        ?.find(channel => channel.channel.id === channelData.id)
        ?.items
        ?.find(item =>
            item.start_unix.unix <= nowUnix &&
            item.end_unix.unix > nowUnix
        );

    document.getElementById("currentlyChannel").textContent =
        channelData.name.toUpperCase();

    if (!currentItem) {

        document.getElementById("currentlyTitle").textContent =
            "No program currently airing";

        document.getElementById("currentlyDescription").textContent =
            "";

        document.getElementById("currentlyTime").textContent =
            "";

        return;
    }

    const title = currentItem.announce ?
        currentItem.metadata?.title ||
        currentItem.name ||
        "Local Announcements" :
        "Local Announcements";

    document.getElementById("currentlyTitle").textContent =
        title;

    document.getElementById("currentlyDescription").textContent =
        currentItem.metadata?.description || "";

    const start = new Date(currentItem.start_unix.unix * 1000);
    const end = new Date(currentItem.end_unix.unix * 1000);

    document.getElementById("currentlyTime").textContent =
        `${start.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        })} – ${end.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        })}`;
}

loadSchedule(selectedDate);