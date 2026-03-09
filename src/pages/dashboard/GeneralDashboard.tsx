import React from 'react';
import { Col, Row, Card, ListGroup, Badge, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faExchangeAlt,
  faBuilding,
  faCheckCircle,
  faBell,
  faArrowUp,
  faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import ReactECharts from 'echarts-for-react';

const GeneralDashboard = () => {
  // Mock Data
  const stats = [
    {
      title: 'Total Citizens',
      value: '12,345',
      change: '+5.2%',
      isIncrease: true,
      icon: faUsers,
      color: 'primary'
    },
    {
      title: 'Transaction Volume',
      value: '8,432',
      change: '+12.5%',
      isIncrease: true,
      icon: faExchangeAlt,
      color: 'info'
    },
    {
      title: 'Dept Performance',
      value: '94%',
      change: '-1.2%',
      isIncrease: false,
      icon: faBuilding,
      color: 'warning'
    },
    {
      title: 'Compliance Rate',
      value: '98.5%',
      change: '+0.5%',
      isIncrease: true,
      icon: faCheckCircle,
      color: 'success'
    }
  ];

  const alerts = [
    {
      id: 1,
      title: 'New Citizen Registration',
      message: 'John Doe has been registered as a new citizen.',
      time: '2 mins ago',
      type: 'success'
    },
    {
      id: 2,
      title: 'High Transaction Volume',
      message: 'Unusual spike in transactions detected in Finance Dept.',
      time: '15 mins ago',
      type: 'warning'
    },
    {
      id: 3,
      title: 'System Maintenance',
      message: 'Scheduled maintenance for tonight at 2:00 AM.',
      time: '1 hour ago',
      type: 'info'
    },
    {
      id: 4,
      title: 'Compliance Issue',
      message: 'Department A missed the compliance deadline.',
      time: '3 hours ago',
      type: 'danger'
    }
  ];

  const chartOption = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        type: 'line',
        smooth: true,
        itemStyle: {
          color: '#3874ff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(56, 116, 255, 0.5)'
              },
              {
                offset: 1,
                color: 'rgba(56, 116, 255, 0)'
              }
            ]
          }
        }
      }
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  };

  return (
    <div className="pb-5">
      <div className="mb-4">
        <h2 className="mb-2">Dashboard</h2>
        <h5 className="text-body-tertiary fw-semibold">
          Overview Analytics
        </h5>
      </div>

      <Row className="g-4 mb-6">
        {stats.map((stat, index) => (
          <Col xs={12} sm={6} xl={3} key={index}>
            <Card className="h-100">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className={`icon-wrapper bg-${stat.color}-subtle text-${stat.color} rounded-circle p-3 d-flex align-items-center justify-content-center`} style={{ width: '48px', height: '48px' }}>
                    <FontAwesomeIcon icon={stat.icon} size="lg" />
                  </div>
                  <Badge bg={stat.isIncrease ? 'success-subtle' : 'danger-subtle'} text={stat.isIncrease ? 'success' : 'danger'} className="fs-9">
                    <FontAwesomeIcon icon={stat.isIncrease ? faArrowUp : faArrowDown} className="me-1" />
                    {stat.change}
                  </Badge>
                </div>
                <h4 className="mb-1">{stat.value}</h4>
                <p className="text-body-secondary mb-0 fs-9">{stat.title}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4">
        <Col xs={12} xl={8}>
          <Card className="h-100">
            <Card.Header className="border-bottom">
              <h5 className="mb-0">Transaction Volume History</h5>
            </Card.Header>
            <Card.Body>
              <ReactECharts option={chartOption} style={{ height: '300px' }} />
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} xl={4}>
          <Card className="h-100">
            <Card.Header className="border-bottom d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Real-time Alerts</h5>
              <FontAwesomeIcon icon={faBell} className="text-body-tertiary" />
            </Card.Header>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                {alerts.map((alert) => (
                  <ListGroup.Item key={alert.id} className="py-3 px-4">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="me-2">
                        <h6 className="mb-1 text-body-highlight">{alert.title}</h6>
                        <p className="text-body-secondary fs-9 mb-0 text-wrap">{alert.message}</p>
                      </div>
                      <small className="text-body-tertiary text-nowrap">{alert.time}</small>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
            <Card.Footer className="border-top text-center">
              <a href="#!" className="fw-semibold">View all alerts</a>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mt-2">
        <Col xs={12}>
          <Card>
            <Card.Header className="border-bottom">
              <h5 className="mb-0">Department Performance</h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-4">
                {['Finance', 'HR', 'IT', 'Operations'].map((dept, idx) => (
                  <Col xs={12} md={6} xl={3} key={idx}>
                    <div className="mb-2 d-flex justify-content-between">
                      <span className="fw-bold">{dept}</span>
                      <span className="text-body-secondary">{85 + idx * 3}%</span>
                    </div>
                    <ProgressBar now={85 + idx * 3} variant={idx % 2 === 0 ? 'primary' : 'info'} style={{ height: '6px' }} />
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default GeneralDashboard;
