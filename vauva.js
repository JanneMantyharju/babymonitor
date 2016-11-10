server = "http://" + window.location.hostname + ":8088/janus";

var janus = null;
var streaming = null;

$(document).ready(function() {
    Janus.init({debug: "all", callback: function() {
        
        // Create session
        janus = new Janus(
            {
                server: server,
                success: function() {
                    // Attach to streaming plugin
                    janus.attach(
                        {
                            plugin: "janus.plugin.streaming",
                            success: function(pluginHandle) {
                                $('#details').remove();
                                streaming = pluginHandle;
                                Janus.log("Plugin attached! (" + streaming.getPlugin() + ", id=" + streaming.getId() + ")");
                                var body = { "request": "watch", id: 1 };
                                streaming.send({"message": body});
                            },
                            error: function(error) {
                                Janus.error("  -- Error attaching plugin... ", error);
                            },
                            onmessage: function(msg, jsep) {
                                    Janus.debug(" ::: Got a message :::");
                                    Janus.debug(JSON.stringify(msg));
                                    var result = msg["result"];
                                    if(jsep !== undefined && jsep !== null) {
                                        Janus.debug("Handling SDP as well...");
                                        Janus.debug(jsep);
                                        // Answer
                                        streaming.createAnswer(
                                            {
                                                jsep: jsep,
                                                media: { audioSend: false, videoSend: false },  // We want recvonly audio/video
                                                success: function(jsep) {
                                                    Janus.debug("Got SDP!");
                                                    Janus.debug(jsep);
                                                    var body = { "request": "start" };
                                                    streaming.send({"message": body, "jsep": jsep});
                                                },
                                                error: function(error) {
                                                    Janus.error("WebRTC error:", error);
                                                }
                                            });
                                    }
                                },
                            onremotestream: function(stream) {
                                Janus.debug(" ::: Got a remote stream :::");
                                Janus.debug(JSON.stringify(stream));
                                attachMediaStream($('#remotevideo').get(0), stream);
                            },
                            oncleanup: function() {
                                Janus.log(" ::: Got a cleanup notification :::");
                                $('#waitingvideo').remove();
                                $('#remotevideo').remove();
                            }
                        });
                },
                error: function(error) {
                    Janus.error(error);
                },
                destroyed: function() {
                    window.location.reload();
                }
            });
    }});
});