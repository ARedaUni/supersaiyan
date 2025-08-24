import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";

interface ApiWafStackProps extends StackProps {
  readonly envPrefix: string;
  readonly allowedIpV4AddressRanges?: string[];
  readonly allowedIpV6AddressRanges?: string[];
}

/**
 * API WAF for Regional resources (API Gateway)
 */
export class ApiWafStack extends Stack {
  /**
   * Web ACL ARN
   */
  public readonly webAclArn: string;

  constructor(scope: Construct, id: string, props: ApiWafStackProps) {
    super(scope, id, props);

    const sepHyphen = props.envPrefix ? "-" : "";
    const rules: wafv2.CfnWebACL.RuleProperty[] = [];

    // Add managed rules first
    rules.push(
      {
        name: 'AWSManagedRulesCommonRuleSet',
        priority: 1,
        statement: {
          managedRuleGroupStatement: {
            vendorName: 'AWS',
            name: 'AWSManagedRulesCommonRuleSet',
          },
        },
        overrideAction: { none: {} },
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: 'CommonRuleSetMetric',
        },
      },
      {
        name: 'AWSManagedRulesKnownBadInputsRuleSet',
        priority: 2,
        statement: {
          managedRuleGroupStatement: {
            vendorName: 'AWS',
            name: 'AWSManagedRulesKnownBadInputsRuleSet',
          },
        },
        overrideAction: { none: {} },
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: 'KnownBadInputsRuleSetMetric',
        },
      }
    );

    // Add IP-based rules if provided
    let priority = 10; // Start after managed rules
    
    if (props.allowedIpV4AddressRanges && props.allowedIpV4AddressRanges.length > 0) {
      const ipV4SetReferenceStatement = new wafv2.CfnIPSet(
        this,
        "ApiIpV4Set",
        {
          ipAddressVersion: "IPV4",
          scope: "REGIONAL",
          addresses: props.allowedIpV4AddressRanges,
        }
      );
      rules.push({
        priority,
        name: "ApiWebAclIpV4RuleSet",
        action: { allow: {} },
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: "ApiWebAclIpV4",
          sampledRequestsEnabled: true,
        },
        statement: {
          ipSetReferenceStatement: { arn: ipV4SetReferenceStatement.attrArn },
        },
      });
      priority++;
    }

    if (props.allowedIpV6AddressRanges && props.allowedIpV6AddressRanges.length > 0) {
      const ipV6SetReferenceStatement = new wafv2.CfnIPSet(
        this,
        "ApiIpV6Set",
        {
          ipAddressVersion: "IPV6",
          scope: "REGIONAL",
          addresses: props.allowedIpV6AddressRanges,
        }
      );
      rules.push({
        priority,
        name: "ApiWebAclIpV6RuleSet",
        action: { allow: {} },
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: "ApiWebAclIpV6",
          sampledRequestsEnabled: true,
        },
        statement: {
          ipSetReferenceStatement: { arn: ipV6SetReferenceStatement.attrArn },
        },
      });
    }

    const webAcl = new wafv2.CfnWebACL(this, "ApiWebAcl", {
      defaultAction: { allow: {} }, // Allow all by default, let managed rules block bad requests
      name: `${props.envPrefix}${sepHyphen}ApiWebAcl`,
      scope: "REGIONAL",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "ApiWebAcl",
        sampledRequestsEnabled: true,
      },
      rules,
    });

    this.webAclArn = webAcl.attrArn;

    new CfnOutput(this, "ApiWebAclArn", {
      value: webAcl.attrArn,
      description: "API Gateway WAF Web ACL ARN",
    });
  }
}