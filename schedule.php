<?php

function loadSchedule($date) {
    global $CHANNELS, $API_URL;

    try {
        $responses = [];

        foreach ($CHANNELS as $channel) {
            $response = file_get_contents($API_URL . $channel['id']);
            $data = json_decode($response, true);

            $responses[] = [
                'channel' => $channel,
                'items' => isset($data['items']) ? $data['items'] : [],
            ];
        }

        renderGrid($responses, $date);
    } catch (Exception $error) {
        error_log($error->getMessage());
    }
}