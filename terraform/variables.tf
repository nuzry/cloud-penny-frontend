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
