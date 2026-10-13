# MedGemma Offline AI Integration

This module provides offline AI capabilities for Chikit by Solar using the MedGemma family of medical language models.

## Overview

The MedGemma integration enhances Chikit's AI capabilities by:
- Replacing rule-based AI systems with state-of-the-art medical language models
- Providing offline AI functionality (no internet required after initial setup)
- Maintaining compatibility with existing AI analysis workflows
- Offering fallback to rule-based system when MedGemma is not available

## Features

✅ Symptom analysis using medical AI
✅ Patient record summarization
✅ Laboratory results interpretation
✅ Fallback to rule-based system when offline model unavailable
✅ Audit trail preservation
✅ Environment-based configuration
✅ Seamless integration with existing AI endpoints

## Setup Instructions

### 1. Install MedGemma Inference Server

To use the MedGemma offline capabilities, you need to run a local MedGemma inference server. Here are recommended approaches:

#### Option A: Using Hugging Face Text Generation Inference (TGI)
```bash
# Pull and run MedGemma 4B IT model
docker run --gpus all -p 8000:80 \
  -v /path/to/cache:/data \
  ghcr.io/huggingface/tgi-ghcr:latest \
  --model-id google/medgemma-4b-it \
  --max-total-tokens 512 \
  --max-input-token-length 256
```

#### Option B: Using llama.cpp (for quantized versions)
```bash
# Download quantized MedGemma model
wget https://huggingface.co/google/medgemma-4b-it-gguf/resolve/main/medgemma-4b-it.Q4_K_M.gguf

# Run with llama.cpp server
./server -m medgemma-4b-it-gguf/Q4_K_M.gguf -c 2048 --port 8000
```

#### Option C: Using Hugging Face Transformers (Python)
```bash
pip install torch transformers accelerate
python medgemma_server.py  # Custom server script
```

### 2. Configure Environment Variables

Add these to your `.env` file:

```
# MedGemma Offline AI Configuration
MEDGEMMA_INFERENCE_URL=http://localhost:8000  # Match your server's URL
MEDGEMMA_MODEL_NAME=medgemma-4b-it           # Model being served

# Optional: Adjust timeouts and parameters
# MEDGEMMA_TIMEOUT=30
# MEDGEMMA_MAX_TOKENS=512
```

### 3. Verify Installation

After setting up the inference server, verify it's working:

```bash
curl http://localhost:8000/health
# Should return 200 OK if server is running
```

Then check the API endpoint:
```bash
curl http://localhost:3000/api/ai/medgemma/status
# Should show MedGemma service as available
```

## Usage

Once configured, the AI endpoints automatically use MedGemma when available:

- `POST /api/ai/analyze-symptoms` - Symptom analysis
- `POST /api/ai/summarize-patient` - Patient record summarization  
- `POST /api/ai/interpret-lab` - Lab results interpretation
- `GET /api/ai/medgemma/status` - Service status check

## How It Works

1. **API Request**: Client sends request to AI endpoint (e.g., analyze symptoms)
2. **Service Check**: MedGemma service checks if inference server is available
3. **AI Processing**: If available, sends prompt to MedGemma; if not, uses rule-based fallback
4. **Response Processing**: Parses AI response into structured format
5. **Database Storage**: Saves result to aiAnalysisResults table
6. **Audit Log**: Creates audit trail for the AI analysis
7. **Response**: Returns structured AI analysis to client

## Fallback Behavior

When MedGemma is not available (server not running, network issues, etc.):
- System automatically falls back to existing rule-based AI functions
- Users experience no disruption in service
- Audit logs indicate when fallback was used
- Clear messaging in responses about AI source

## Performance Considerations

- **First Request**: May have latency as model loads (if using serverless inference)
- **Subsequent Requests**: Fast responses once model is loaded in memory
- **Resource Usage**: MedGemma 4B requires ~8GB VRAM for full precision, ~4GB for quantized
- **Concurrent Requests**: Depends on inference server capabilities and hardware

## Model Information

- **Base Model**: Google MedGemma (medgemma-4b-it)
- **Type**: Instruction-tuned medical language model
- **Capabilities**: Medical reasoning, symptom analysis, patient summarization, lab interpretation
- **Languages**: Primarily English (check specific variants for multilingual support)
- **Safety**: Includes medical safety considerations, but should always be used as decision support only

## Safety and Compliance

⚠️ **Important**: MedGemma, like all AI medical tools, is for decision support only:
- Never replace clinical judgment with AI output
- Always review AI-generated content with qualified healthcare professionals
- Maintain proper patient consent and privacy controls
- Follow local regulations for AI use in healthcare
- Document AI-assisted decisions appropriately

## Troubleshooting

### Common Issues

1. **"Cannot connect to inference server"**
   - Verify MEDGEMMA_INFERENCE_URL is correct
   - Check that your MedGemma server is running and accessible
   - Test with curl or similar tool

2. **Slow responses**
   - First request after startup may be slow (model loading)
   - Consider keeping server warm for production use
   - Check GPU/CPU utilization

3. **Poor quality responses**
   - Verify you're using an appropriate MedGemma variant
   - Check prompt formatting and context provided
   - Consider adjusting temperature/max_tokens parameters

4. **Memory issues**
   - Use quantized versions (GGUF) for lower memory requirements
   - Ensure sufficient swap space available
   - Consider model offloading if supported by your inference server

## Development Testing

For development without a full MedGemma server:
- The service will automatically fall back to rule-based AI
- Set MEDGEMMA_INFERENCE_URL to enable MedGemma features
- The fallback system ensures no loss of functionality during development

## Production Deployment

For production use:
1. Deploy MedGemma inference server on GPU-enabled infrastructure
2. Use proper reverse proxy (NGINX, Traefik) for SSL and load balancing
3. Implement rate limiting and authentication on the inference service
4. Monitor service health and response times
5. Keep models updated with latest MedGemma releases
6. Plan for model versioning and rollback capabilities

## Integration Points

The MedGemma service integrates with:
- Existing AI analysis endpoints (/api/ai/*)
- Audit logging system
- Patient, medical record, and laboratory data
- Authentication and authorization systems
- Database storage for AI results

## Customization

To customize the MedGemma integration:
1. Modify prompts in medgemma/service.ts for different behaviors
2. Adjust parsing logic for specific output formats
3. Tune generation parameters (temperature, max_tokens, etc.)
4. Add specialized medical prompt templates for different use cases
5. Implement caching for frequently requested analyses

## References

- MedGemma Model: https://huggingface.co/google/medgemma-4b-it
- Hugging Face TGI: https://github.com/huggingface/text-generation-inference
- llama.cpp: https://github.com/ggerganov/llama.cpp
- Google Research MedGemma Paper: [Link to be added]

## Changelog

See git history for detailed changes.

## License

This integration follows the licensing terms of the underlying MedGemma model and Chikit by Solar.