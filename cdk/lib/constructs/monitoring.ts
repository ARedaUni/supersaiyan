import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { CfnOutput, Duration } from 'aws-cdk-lib';

export interface MonitoringProps {
  readonly envPrefix: string;
  readonly kmsKey: kms.IKey;
  readonly apiGatewayId?: string;
  readonly lambdaFunction?: lambda.IFunction;
}

export class Monitoring extends Construct {
  public readonly securityLogGroup: logs.LogGroup;
  public readonly applicationLogGroup: logs.LogGroup;
  public readonly securityAlarmTopic: sns.Topic;
  public readonly apiThrottleAlarm: cloudwatch.Alarm;
  public readonly lambda4xxAlarm: cloudwatch.Alarm;

  constructor(scope: Construct, id: string, props: MonitoringProps) {
    super(scope, id);

    // Create SNS topic for security alerts
    this.securityAlarmTopic = new sns.Topic(this, 'SecurityAlarmTopic', {
      topicName: `${props.envPrefix}-security-alerts`,
      displayName: 'Security Alerts',
    });

    // Create encrypted CloudWatch Log Groups
    this.securityLogGroup = new logs.LogGroup(this, 'SecurityLogGroup', {
      logGroupName: `/aws/${props.envPrefix}/security`,
      retention: logs.RetentionDays.SIX_MONTHS,
      encryptionKey: props.kmsKey,
    });

    this.applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/${props.envPrefix}/application`,
      retention: logs.RetentionDays.THREE_MONTHS,
      encryptionKey: props.kmsKey,
    });

    // API Gateway monitoring
    if (props.apiGatewayId) {
      // API Gateway throttle alarm
      this.apiThrottleAlarm = new cloudwatch.Alarm(this, 'ApiThrottleAlarm', {
        alarmName: `${props.envPrefix}-api-throttle-alarm`,
        alarmDescription: 'Alert when API Gateway requests are being throttled',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'ThrottledCount',
          dimensionsMap: {
            ApiName: props.apiGatewayId,
          },
          statistic: 'Sum',
          period: Duration.minutes(5),
        }),
        threshold: 10,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      });

      this.apiThrottleAlarm.addAlarmAction({
        bind: () => ({
          alarmActionArn: this.securityAlarmTopic.topicArn,
        }),
      });

      // API Gateway 4xx error alarm
      const api4xxAlarm = new cloudwatch.Alarm(this, 'Api4xxAlarm', {
        alarmName: `${props.envPrefix}-api-4xx-alarm`,
        alarmDescription: 'Alert when API Gateway has high 4xx error rate',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          dimensionsMap: {
            ApiName: props.apiGatewayId,
          },
          statistic: 'Sum',
          period: Duration.minutes(5),
        }),
        threshold: 50,
        evaluationPeriods: 3,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      });

      api4xxAlarm.addAlarmAction({
        bind: () => ({
          alarmActionArn: this.securityAlarmTopic.topicArn,
        }),
      });
    }

    // Lambda monitoring
    if (props.lambdaFunction) {
      // Lambda error alarm
      this.lambda4xxAlarm = new cloudwatch.Alarm(this, 'Lambda4xxAlarm', {
        alarmName: `${props.envPrefix}-lambda-error-alarm`,
        alarmDescription: 'Alert when Lambda function has high error rate',
        metric: props.lambdaFunction.metricErrors({
          period: Duration.minutes(5),
        }),
        threshold: 10,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      });

      this.lambda4xxAlarm.addAlarmAction({
        bind: () => ({
          alarmActionArn: this.securityAlarmTopic.topicArn,
        }),
      });

      // Lambda duration alarm (performance monitoring)
      const lambdaDurationAlarm = new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
        alarmName: `${props.envPrefix}-lambda-duration-alarm`,
        alarmDescription: 'Alert when Lambda function duration is high',
        metric: props.lambdaFunction.metricDuration({
          period: Duration.minutes(5),
        }),
        threshold: 30000, // 30 seconds
        evaluationPeriods: 3,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      });

      lambdaDurationAlarm.addAlarmAction({
        bind: () => ({
          alarmActionArn: this.securityAlarmTopic.topicArn,
        }),
      });
    }

    // Create a dashboard for monitoring
    new cloudwatch.Dashboard(this, 'SecurityDashboard', {
      dashboardName: `${props.envPrefix}-security-dashboard`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'API Gateway Requests',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: 'Count',
                dimensionsMap: props.apiGatewayId ? {
                  ApiName: props.apiGatewayId,
                } : undefined,
                statistic: 'Sum',
              }),
            ],
            width: 12,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'API Gateway Errors',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: '4XXError',
                dimensionsMap: props.apiGatewayId ? {
                  ApiName: props.apiGatewayId,
                } : undefined,
                statistic: 'Sum',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: '5XXError',
                dimensionsMap: props.apiGatewayId ? {
                  ApiName: props.apiGatewayId,
                } : undefined,
                statistic: 'Sum',
              }),
            ],
            width: 12,
          }),
        ],
        ...(props.lambdaFunction ? [[
          new cloudwatch.GraphWidget({
            title: 'Lambda Performance',
            left: [props.lambdaFunction.metricErrors()],
            right: [props.lambdaFunction.metricDuration()],
            width: 12,
          }),
        ]] : []),
      ],
    });

    // Outputs
    new CfnOutput(this, 'SecurityLogGroupName', {
      value: this.securityLogGroup.logGroupName,
      description: 'Security log group name',
    });

    new CfnOutput(this, 'SecurityAlarmTopicArn', {
      value: this.securityAlarmTopic.topicArn,
      description: 'SNS topic for security alerts',
    });
  }

  /**
   * Create a custom metric filter for security events
   */
  public addSecurityMetricFilter(
    filterName: string,
    logGroup: logs.LogGroup,
    filterPattern: string,
    metricNamespace: string,
    metricName: string
  ): cloudwatch.Metric {
    const metricFilter = new logs.MetricFilter(this, `${filterName}MetricFilter`, {
      logGroup,
      metricNamespace,
      metricName,
      filterPattern: logs.FilterPattern.literal(filterPattern),
      metricValue: '1',
    });

    const metric = new cloudwatch.Metric({
      namespace: metricNamespace,
      metricName,
      statistic: 'Sum',
      period: Duration.minutes(5),
    });

    // Create alarm for this security metric
    const alarm = new cloudwatch.Alarm(this, `${filterName}Alarm`, {
      alarmName: `${filterName}-security-alarm`,
      alarmDescription: `Security alert for ${filterName}`,
      metric,
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    alarm.addAlarmAction({
      bind: () => ({
        alarmActionArn: this.securityAlarmTopic.topicArn,
      }),
    });

    return metric;
  }
}