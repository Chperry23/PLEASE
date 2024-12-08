// src/components/QuotePDF.js
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    padding: 30, 
    backgroundColor: '#ffffff' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  logo: { 
    width: 80, 
    height: 80 
  },
  businessInfo: { 
    fontSize: 10, 
    textAlign: 'right'
  },
  title: { 
    fontSize: 24, 
    marginBottom: 20, 
    color: '#333333', 
    fontWeight: 'bold' 
  },
  subheader: { 
    fontSize: 18, 
    marginBottom: 10, 
    color: '#333333', 
    fontWeight: 'bold' 
  },
  text: { 
    fontSize: 12, 
    marginBottom: 5, 
    color: '#333333' 
  },
  bold: { 
    fontWeight: 'bold' 
  },
  table: { 
    display: 'table', 
    width: 'auto', 
    marginTop: 10 
  },
  tableRow: { 
    flexDirection: 'row' 
  },
  tableCol: { 
    width: '33.33%', 
    borderStyle: 'solid', 
    borderWidth: 1, 
    borderColor: '#bfbfbf' 
  },
  tableCell: { 
    margin: 'auto', 
    marginTop: 5, 
    marginBottom: 5, 
    fontSize: 10 
  },
  section: {
    marginBottom: 20
  }
});

const QuotePDF = ({ quote, customerInfo, businessInfo }) => {
  const renderCustomerInfo = () => {
    return (
      <>
        <Text style={styles.text}><Text style={styles.bold}>Name:</Text> {customerInfo.name}</Text>
        <Text style={styles.text}><Text style={styles.bold}>Email:</Text> {customerInfo.email}</Text>
        <Text style={styles.text}><Text style={styles.bold}>Phone:</Text> {customerInfo.phone}</Text>
        <Text style={styles.text}><Text style={styles.bold}>Address:</Text> {customerInfo.address.street}, {customerInfo.address.city}, {customerInfo.address.state} {customerInfo.address.zipCode}</Text>
      </>
    );
  };

  const renderLineItems = () => {
    if (!quote.lineItems || quote.lineItems.length === 0) return null;

    return (
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Service</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Description</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Price</Text></View>
        </View>
        {quote.lineItems.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{item.service}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{item.description}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>${item.price.toFixed(2)}</Text></View>
          </View>
        ))}
      </View>
    );
  };

  const modeLabel = quote.mode === 'commercial' ? 'Commercial' : 'Residential';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {businessInfo.logo ? <Image style={styles.logo} src={businessInfo.logo} /> : <View />}
          <View style={styles.businessInfo}>
            <Text>{businessInfo.name}</Text>
            <Text>{businessInfo.address}</Text>
            <Text>{businessInfo.phone}</Text>
            <Text>{businessInfo.email}</Text>
            <Text>{businessInfo.website}</Text>
          </View>
        </View>
        <Text style={styles.title}>Quote #{quote._id}</Text>

        <View style={styles.section}>
          <Text style={styles.subheader}>Customer Information</Text>
          {renderCustomerInfo()}
        </View>

        <View style={styles.section}>
          <Text style={styles.subheader}>Details</Text>
          <Text style={styles.text}><Text style={styles.bold}>Mode:</Text> {modeLabel}</Text>
          {renderLineItems()}
          <Text style={[styles.text, {marginTop:10}]}><Text style={styles.bold}>Total:</Text> ${quote.totalPrice.toFixed(2)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheader}>Expiration & Terms</Text>
          <Text style={styles.text}><Text style={styles.bold}>Valid Until:</Text> {quote.expirationDate}</Text>
          <Text style={styles.text}><Text style={styles.bold}>Terms:</Text> {quote.terms}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default QuotePDF;
