variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "ap-southeast-1"
}

variable "bucket_name" {
  description = "The name of the S3 bucket for hosting the frontend (must be globally unique)"
  type        = string
  default     = "cloudpenny-frontend-prod-v1"
}

variable "api_gateway_domain_name" {
  description = "The execute-api domain of the backend HTTP API, proxied through this distribution at /api/*"
  type        = string
  default     = "d9olex4f3k.execute-api.ap-southeast-1.amazonaws.com"
}

variable "api_gateway_stage" {
  description = "The API Gateway stage name, prepended to forwarded requests so /api/* reaches /{stage}/api/*"
  type        = string
  default     = "dev"
}
