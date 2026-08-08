output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution (used in GitHub Actions for cache invalidation)"
  value       = aws_cloudfront_distribution.frontend_distribution.id
}

output "cloudfront_domain_name" {
  description = "The public URL of your Cloud Penny application"
  value       = aws_cloudfront_distribution.frontend_distribution.domain_name
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket"
  value       = aws_s3_bucket.frontend_bucket.id
}
