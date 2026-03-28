#include <smartspectra/container/foreground_container.hpp>
#include <smartspectra/container/settings.hpp>
#include <physiology/modules/messages/metrics.h>
#include <glog/logging.h>
#include <iostream>

using namespace presage::smartspectra;

int main(int argc, char** argv) {
    // Initialize logging (suppress standard logs so they don't mess up our JSON)
    google::InitGoogleLogging(argv[0]);
    FLAGS_minloglevel = 2; 

    // Get API key from command line or environment
    std::string api_key = (argc > 1) ? argv[1] : "";
    if (api_key.empty() && std::getenv("SMARTSPECTRA_API_KEY")) {
        api_key = std::getenv("SMARTSPECTRA_API_KEY");
    }

    if (api_key.empty()) {
        std::cerr << "Error: Missing SMARTSPECTRA_API_KEY\n";
        return 1;
    }

    try {
        // Setup configuration
        container::settings::Settings<
            container::settings::OperationMode::Continuous,
            container::settings::IntegrationMode::Rest
        > settings;

        // CRITICAL FOR DOCKER: Run without a GUI window
        settings.headless = true;
        settings.enable_edge_metrics = true;
        settings.integration.api_key = api_key;
        
        // NOTE: Since Docker can't access your Mac/Windows webcam, 
        // you would eventually pass video frames via network here.
        // If you have a test MP4 file, you can uncomment the next line:
        // settings.video_source.input_video_path = "/app/test_video.mp4";

        auto container = std::make_unique<container::CpuContinuousRestForegroundContainer>(settings);

        // Define what happens when we get vitals data
        auto status = container->SetOnCoreMetricsOutput(
            [](const presage::physiology::MetricsBuffer& metrics, int64_t timestamp) {
                float pulse = 0;
                float breathing = 0;
                
                if (!metrics.pulse().rate().empty()) {
                    pulse = metrics.pulse().rate().rbegin()->value();
                }
                if (!metrics.breathing().rate().empty()) {
                    breathing = metrics.breathing().rate().rbegin()->value();
                }

                // OUTPUT PURE JSON FOR NEXT.JS TO READ
                if (pulse > 0 && breathing > 0) {
                    std::cout << "{\"pulse\": " << pulse << ", \"breathing\": " << breathing << "}" << std::endl;
                }
                return absl::OkStatus();
            }
        );

        if (!status.ok()) return 1;

        // Initialize and Run
        if (auto init_status = container->Initialize(); !init_status.ok()) {
            std::cerr << "Initialization Failed (Check camera/video setup): " << init_status.message() << "\n";
            return 1;
        }

        container->Run();
        return 0;

    } catch (const std::exception& e) {
        std::cerr << "Fatal Error: " << e.what() << "\n";
        return 1;
    }
}