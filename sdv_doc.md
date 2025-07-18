# Data Preparation

Multi table data is present in multiple tables that each have rows and columns. The tables are connected to each other through foreign and primary key references.

<figure><img src="https://1967107441-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FfNxEeZzl9uFiJ4Zf4BRZ%2Fuploads%2FpPLDP2gOJBQvF5yF6Zmz%2Fmulti-table-data-data-preparation_May%208%202025.png?alt=media&#x26;token=f23c6cac-43db-4e08-9eaf-5c850aacecfc" alt=""><figcaption><p>This example of a multi table dataset has a table for hotels and a table for their guests. Each hotel has multiple guests who have visited.</p></figcaption></figure>

Before you begin creating synthetic data, it's important to have your data ready in the right format:

1. **Data**, a dictionary that maps every table name to a pandas DataFrame object containing the actual data
2. **Metadata**, a [Metadata](../concepts/metadata) object that describes your table. It includes the data types in each column, keys and the connections between tables.

<details>

<summary>Click to see the metadata</summary>

```python
{
    "METADATA_SPEC_VERSION": "V1",
    "tables": {
        "guests": {
          "primary_key": "guest_email",
          "alternate_keys": ["credit_card_number"],
          "columns": {
            "guest_email": { "sdtype": "email", "pii": True },
            "hotel_id": { "sdtype": "id", "regex_format": "HID_[0-9]{3}" },
            "has_rewards": { "sdtype": "boolean" },
            "room_type": { "sdtype": "categorical" },
            "amenities_fee": { "sdtype": "numerical" },
            "checkin_date": { "sdtype": "datetime", "datetime_format":  "%d %b %Y"},
            "checkout_date": { "sdtype": "datetime", "datetime_format": "%d %b %Y"},
            "room_rate": { "sdtype": "numerical" },
            "billing_address": { "sdtype": "address", "pii": True},
            "credit_card_number": { "sdtype": "credit_card_number", "pii": True}
          }
        },
        "hotels": {
            "primary_key": "hotel_id",
            "columns": {
                "hotel_id": { "sdtype": "id", "regex_format": "HID_[0-9]{3}" },
                "city": { "sdtype": "categorical" },
                "state": { "sdtype": "categorical" },
                "rating": { "sdtype": "numerical" },
                "classification": { "sdtype": "categorical" }
            }
        }
    },
    "relationships": [{
        "parent_table_name": "hotels",
        "parent_primary_key": "hotel_id",
        "child_table_name": "guests",
        "child_foreign_key": "hotel_id"
    }]
}
```

</details>

### Learn More

<table data-card-size="large" data-view="cards"><thead><tr><th></th><th></th><th data-hidden data-card-target data-type="content-ref"></th></tr></thead><tbody><tr><td><a href="data-preparation/loading-data"><strong>Loading Data</strong></a></td><td>Get started with a demo dataset or load your own data.</td><td><a href="data-preparation/loading-data">loading-data</a></td></tr><tr><td><a href="data-preparation/creating-metadata"><strong>Creating Metadata</strong></a></td><td>Create an object to describe the different columns in your data. Save it for future use.</td><td><a href="data-preparation/creating-metadata">creating-metadata</a></td></tr></tbody></table>

## Multi Table Schemas

{% hint style="info" %}
**What kinds of multi table schemas are compatible with the SDV?** The SDV can be used to model many different types of multi table dataset schemas as long as they meet the criteria below.

1. **There should be no cyclical dependencies.** For eg, a table cannot refer to itself. Or if table A refers to table B, then table B cannot refer back to table A.
2. **There should be no missing references** (aka orphan rows). If a table A refers to table B, then every reference must be found. Note that it is ok if a parent row has no children.
3. **The relationships should be one-to-many**. SDV supports relationships between a parent primary key and a child foreign key. It does not support many-to-many or one-to-one relationships, though there are ways to workaround this for your schema.

\
&#xNAN;_&#x4E;ote that as of SDV 1.14.0, it is ok if your tables are not all connected to each other. This means, it's ok to have separate, disconnected groups of tables within a synthesizer._
{% endhint %}

# Loading Data

Load your data into Python to use it for SDV modeling. SDV supports many different types of data formats for import and export.

{% hint style="info" %}
**Don't have any data yet?** The SDV library contains many different demo datasets that you can use to get started. To learn more, see the [SDV Demo Data](loading-data/demo-data) page.
{% endhint %}

## Local Data

If your data is already available as local files (on your own machine), load them into SDV using the functions below.

<table data-view="cards"><thead><tr><th></th><th></th><th data-hidden data-card-target data-type="content-ref"></th></tr></thead><tbody><tr><td><a href="loading-data/csv"><strong>CSV Data</strong></a></td><td>Load multiple CSV files into Python.</td><td><a href="loading-data/csv">csv</a></td></tr><tr><td><a href="loading-data/excel"><strong>Excel Spreadsheet</strong></a></td><td>Load an entire Excel spreadsheet into Python.</td><td><a href="loading-data/excel">excel</a></td></tr></tbody></table>

## **❖** Connect to a database (AI Connectors)

{% include "https://app.gitbook.com/s/fNxEeZzl9uFiJ4Zf4BRZ/~/reusable/Ar70IN8nxdMFx7wKfCXs/" %}

If your data is available in a database, use our AI Connectors feature to directly import some data for SDV. Later you can use the same connector to export synthetic data into a new database.

{% include "https://app.gitbook.com/s/fNxEeZzl9uFiJ4Zf4BRZ/~/reusable/mZilZ9uq0DucXl23y4Z9/" %}

## Do you have data in other formats?

The SDV uses the [pandas library](https://pandas.pydata.org/) for data manipulation and synthesizing. If your data is in any other format, load it in as a [pandas.DataFrame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html) object to use in the SDV. For multi table data, make sure you format your data as a dictionary, mapping each table name to a different DataFrame object.

```python
multi_table_data = {
    'table_name_1': <pandas.DataFrame>,
    'table_name_2': <pandas.DataFrame>,
    ...
}
```

Pandas offers many methods to load in different types of data. For example: [SQL table](https://pandas.pydata.org/docs/reference/api/pandas.read_sql_table.html#pandas.read_sql_table) or  [JSON string](https://pandas.pydata.org/docs/reference/api/pandas.read_json.html#pandas.read_json).

```python
import pandas as pd

data_table_1 = pd.read_json('file://localhost/path/to/table_1.json')
data_table_2 = pd.read_json('file://localhost/path/to/table_2.json')
```

For more options, see the [pandas reference](https://pandas.pydata.org/docs/reference/io.html).

# CSV

{% hint style="warning" %}
**This functionality is in Beta!** Beta functionality may have bugs and may change in the future. Help us out by testing this functionality and letting us know if you encounter any issues.
{% endhint %}

### CSVHandler <a href="#bigqueryconnector" id="bigqueryconnector"></a>

Use this object to create a handler for reading and writing local CSV files.

```python
from sdv.io.local import CSVHandler

connector = CSVHandler()
```

**Parameters** (None)

**Output** A CSVHandler object you can use to read and write CSV files

### read

Use this function to read multiple CSV files form your local machine

```python
data = connector.read(
    folder_name='project/data/',
    file_names=['users.csv', 'transactions.csv', 'sessions.csv'],
    read_csv_parameters={
        'parse_dates': False,
        'encoding':'latin-1'
    }
)
```

**Parameters**

* (required) `folder_name`: A string name of the folder that contains your CSV files
* `file_names`: A list of strings with the exact file names to read
  * (default) `None`: Read all the CSV files that are in the specified folder
  * `<list>`: Only read the list of CSV files that are in the list
* `read_csv_parameters`: A dictionary with additional parameters to use when reading the CSVs. The keys are any of the parameter names of the [pands.read\_csv](https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html) function and the values are your inputs.
  * (default) `{ 'parse_dates': False, 'low_memory': False, 'on_bad_lines': 'warn'}`: Do not infer any datetime formats, assume low memory, or error if it's not possible to read a line. (Use all the other defaults of the `read_csv` function.)

**Output** A dictionary that contains all the CSV data found in the folder. The key is the name of the file (without the `.csv` suffix) and the value is a [pandas DataFrame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html) containing the data.

### write

Use this function to write synthetic data as multiple CSV files

```python
connector.write(
  synthetic_data,
  folder_name='project/synthetic_data',
  to_csv_parameters={
      'encoding': 'latin-1',
      'index': False
  },
  file_name_suffix='_v1', 
  mode='x')
)
```

**Parameters**

* (required) `synthetic_data`: You data, represented as a dictionary. The key is the name of each table and the value is a [pandas DataFrame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html) containing the data.&#x20;
* (required) `folder_name`: A string name of the folder where you would like to write the synthetic data
* `to_csv_parameters`: A dictionary with additional parameters to use when writing the CSVs. The keys are any of the parameter names of the [pandas.to\_csv](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_csv.html) function and the values are your inputs.
  * (default) `{ 'index': False }`: Do not write the index column to the CSV. (Use all the other defaults of the `to_csv` function.)
* `file_name_suffix`: The suffix to add to each filename. Use this if to add specific version numbers or other info.
  * (default) `None`: Do not add a suffix. The file name will be the same as the table name with a `.csv` extension
  * \<string>: Append the suffix after the table name. Eg. a suffix `'_synth1'` will write a file as `table_synth1.csv`&#x20;
* `mode`: A string signaling which mode of writing to use
  * (default) `'x'`: Write to new files, raising errors if any existing files exist with the same name
  * `'w'`: Write to new files, clearing any existing files that exist
  * `'a'`: Append the new CSV rows to any existing files

**Output** (None) The data will be written as CSV files

# Excel

{% hint style="warning" %}
**This functionality is in Beta!** Beta functionality may have bugs and may change in the future. Help us out by testing this functionality and letting us know if you encounter any issues.
{% endhint %}

### Installation <a href="#bigqueryconnector" id="bigqueryconnector"></a>

To work with Excel files in SDV, please install SDV with the optional dependencies using:

```
pip install 'sdv[excel]'
```

### ExcelHandler <a href="#bigqueryconnector" id="bigqueryconnector"></a>

Use this object to create a handler for reading and writing an local Excel spreadsheet

```python
from sdv.io.local import ExcelHandler

connector = ExcelHandler()
```

**Parameters** (None)

**Output** An ExcelHandler object you can use to read and write an Excel spreadsheet

### read

Use this function to read an Excel spreadsheet from your local machine

```python
data = connector.read(
    filepath='project/data.xlsx',
    sheet_names=['guests', 'hotels']
)
```

**Parameters**

* (required) `filepath`: A string name of the Excel spreadsheet, which must end in `.xlsx`
* `sheet_names` : A list of sheet names to read from the overall spreadsheet. Each sheet is a tab in your spreadsheet file, and represents a different table.
  * (default) `None`: Read all the sheets of the overall spreadsheet
  * \<list>: Read only the sheets listed from the overall spreadsheet

**Output** A dictionary that contains all the data found the Excel file. The key is the name of the sheet and the value is a [pandas DataFrame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html) containing the data.

### write

Use this function to write synthetic data into an Excel spreadsheet

```python
connector.write(
  synthetic_data,
  filepath='project/synthetic_data.xlsx',
  mode='x'
)
```

**Parameters**

* (required) `synthetic_data`: You data, represented as a dictionary. The key is the name of each table and the value is a [pandas DataFrame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html) containing the data.&#x20;
* (required) `filepath`: A string name of the file where you would like to write the synthetic data
* `sheet_name_suffix`: The suffix to add to each sheet name. Use this if to add specific version numbers or other info.
  * (default) `None`: Do not add a suffix. Each sheet will be named with table name
  * \<string>: Append the suffix after each table name. Eg. a suffix `'_synth1'` will write a sheet as `table_synth1`&#x20;
* `mode`: A string signaling which mode of writing to use
  * (default) `'w'`: Write sheets to a new Excel file, clearing any existing file that may exist
  * `'a'`: Write the data as new sheets within an existing Excel file

**Output** (None) The data will be written as an Excel spreadsheet


# Cleaning Your Data

Use the utility functions below to clean your multi-table data for fast and effective multi-table modeling.

### drop\_unknown\_references

Multi-table SDV synthesizers work best when your dataset has _referential integrity_, meaning that all the references in a foreign key refer to an existing value in the primary key. Use this function to drop rows that contain unknown references for your synthesizer.

**Parameters**

* (required) `metadata`: A [Metadata](creating-metadata) object
* (required) `data`: A dictionary that maps each table name to a pandas DataFrame containing data. This data should match your metadata.
* `drop_missing_values`: A boolean that describes whether to drop missing values in the foreign key
  * (default) `True`: If a foreign key has a missing value, treat it as an unknown reference and drop it. _We recommend this setting for maximum efficiency with SDV._
  * `False`: If a foreign key has a missing value, treat it as a valid reference and keep it
* `verbose`: A boolean that controls whether to print out a summary of the results
  * (default) `True`: Print a summary of the number of rows that are dropped from each table

**Output** A dictionary that maps each table name to a pandas DataFrame containing data. The data will contain referential integrity, meaning that there will be no unknown foreign key references.

```python
from sdv.utils import drop_unknown_references

cleaned_data = drop_unknown_references(data, metadata)
```

```
Success! All foreign keys have referential integrity. 

Table Name    # Rows (Original)    # Invalid Rows   # Rows (New)
sessions      1200                 50               1150     
transactions  5000                 0                5000
```

### simplify\_schema

By default, some synthesizers like HMA, are not designed to work with a large number of tables or columns. This function will reduce your schema to a minimal set, by dropping some tables and columns. It will allow you to complete your proof-of-concept using public SDV.

{% hint style="success" %}
After completing your proof-of-concept, you can [reach out to us](https://datacebo.com/support/) to inquire about our paid SDV plans. SDV Enterprise supports work many more tables, so you will not have to use `simplify_schema` on the paid plan.
{% endhint %}

**Parameters**

* (required) `data`: A dictionary that maps each table name to a pandas DataFrame containing data. This data should match your metadata.
* (required) `metadata`: A [Metadata](creating-metadata) object that describes your data.

**Output**:&#x20;

* `simplified_data`: A dictionary that maps a table name to a pandas DataFrame containing the data. The simplified data schema may have fewer tables and columns than the original.
* `simplified_metadata`: A Metadata object that describes the simplified data

```python
from sdv.utils import poc

simplified_data, simplified_metadata = poc.simplify_schema(data, metadata)
```

### get\_random\_subset

Use this function to subsample data from your dataset. This function will keep the same overall schema (and columns) but it will reduce the number of rows in each table.

```python
from sdv.utils import poc

subsampled_data = poc.get_random_subset(
    data, 
    metadata,
    main_table_name="users", 
    num_rows=100
)
```

**Parameters**

* (required) `data`: Your full dataset. A dictionary that maps a table name to a pandas DataFrame containing the data
* (required) `metadata`: A Metadata object that describes the data
* (required) `main_table_name`: A string with the name of the most important table in your dataset. We'll make sure the subsample is optimized for this main table.
* (required) `num_rows`: The number of rows to subsample from the main table. All other table's sizes will be algorithmically determined based on this.
* `verbose`: Whether to print out the results
  * (default) `True`: Print out how many rows were included from each table
  * `False`: Do not print anything out

**Output** A dataset with fewer rows than before. The dataset will continue to have _referential integrity_ meaning that there will be no invalid or missing references between the tables.

# Creating Metadata

## Auto Detect Metadata

If you don't already have a metadata object, we recommend auto-detecting it based on your data.

### detect\_from\_dataframes

Use this function to automatically detect metadata from your data that you've loaded as a pandas.DataFrame objects.

**Parameters**:

* (required) `data`: Your data, represented as a dictionary. The keys are your table names and values are the pandas.DataFrame objects containing your data.
* `infer_sdtypes`: A boolean describing whether to infer the sdtypes of each column
  * (default) `True`: Infer the sdtypes of each column based on the data.
  * `False`: Do not infer the sdtypes. All columns will be marked as unknown, ready for you to manually update.
* `infer_keys`: A string describing whether to infer the primary and/or foreign keys.
  * (default) `'primary_and_foreign'`: Infer the primary keys in each table, and the foreign keys in other tables that refer to them
  * `'primary_only'`: Infer the primary keys in each table. You can manually add the foreign key relationships later.
  * `None`: Do not infer any primary or foreign keys. You can manually add these later.
* `foreign_key_inference_algorithm`: The algorithm to use when inferring the foreign key connections to primary keys
  * (default) `'column_name_match'`: Match up foreign and primary key columns that have the same names
  * ＊(default, SDV Enterprise) `'data_match'`: Match up foreign and primary key columns based on the data that they contain

**Output** A Metadata object that describes the data

```python
from sdv.metadata import Metadata

metadata = Metadata.detect_from_dataframes(
    data={
        'hotels': hotels_dataframe,
        'guests': guests_dataframe
    })
```

{% include "https://app.gitbook.com/s/fNxEeZzl9uFiJ4Zf4BRZ/~/reusable/t4iXSmNwWTqdGjAbDFWT/" %}

## Updating Metadata

{% hint style="danger" %}
**The detected metadata is not guaranteed to be accurate or complete.** Be sure to carefully inspect the metadata and update information.

**For more information about inspecting and updating your metadata, see the** [**Metadata API reference**](../../concepts/metadata/metadata-api)**.**
{% endhint %}

```python
metadata.update_column(
    column_name='age',
    sdtype='numerical',
    table_name='users'
)

metadata.validate()
```

## Saving, Loading & Sharing Metadata

You can save the metadata object as a JSON file and load it again for future use.

### save\_to\_json

Use this to save the metadata object to a new JSON file that will be compatible with SDV 1.0 and beyond. We recommend you write the metadata to a new file every time you update it.

**Parameters**

* (required) `filepath`: The location of the file that will be created with the JSON metadata
* `mode`: A string describing the mode to use when creating the JSON file
  * (default) `'write'`: Write the metadata to the file, raising an error if the file already exists
  * `'overwrite'`: Write the metadata to the file, replacing the contents if the file already exists

**Output** (None)&#x20;

```python
metadata.save_to_json(filepath='my_metadata_v1.json')
```

### load\_from\_json

Use this method to load your file as a Metadata object.

**Parameters**

* (required) `filepath`: The name of the file containing the JSON metadata

**Output:** A Metadata object.

```
metadata = Metadata.load_from_json(filepath='my_metadata_v1.json')
```

# Modeling

The SDV creates synthetic data using machine learning. A **synthesizer** is an object that you can use to accomplish this task.

1. You'll start by creating a synthesizer based on your metadata
2. Next, you'll train the synthesizer using real data. In this phase, the synthesizer will learn patterns from the real data.
3. Once your synthesizer is trained, you can use it to generate new, synthetic data.

```python
from sdv.multi_table import HMASynthesizer

# Step 1: Create the synthesizer
synthesizer = HMASynthesizer(metadata)

# Step 2: Train the synthesizer
synthesizer.fit(real_data)

# Step 3: Generate synthetic data
synthetic_data = synthesizer.sample()
```

## What's next?

**Explore the** [**synthesizers**](modeling/synthesizers)**.** Create multi table synthetic data using a variety of synthesizers.

**Want to improve your synthetic data?** You can control the pre- and post-processing steps in your synthesizer, and set up custom, anonymization controls. You can also enforce logical rules in the form of constraints. See the [**Advanced Features**](modeling/customizations) for more options. \

# HMASynthesizer

The HMA Synthesizer uses hierarchical ML algorithm to learn from real data and generate synthetic data.  The algorithm uses classical statistics.

```python
from sdv.multi_table import HMASynthesizer

synthesizer = HMASynthesizer(metadata)
synthesizer.fit(data)

synthetic_data = synthesizer.sample()
```

{% hint style="warning" %}
**Is the HMASynthesizer suited for your dataset?** The HMASynthesizer is designed to capture correlations between different tables with high quality. The algorithm is optimized for datasets with around 5 tables and 1 level of depth (eg. a parent and its child table). If you have a complex schema, use the [`simplify_schema`](../../../data-preparation/loading-data#simplify_schema) function to create a smaller, simpler dataset for HMASynthesizer.

**Want to model more complex graphs?** You can [reach out to us](https://datacebo.com/support/) to inquire about our paid SDV plans. SDV Enterprise supports work many more tables, so you will not have to use `simplify_schema` on the paid plan.
{% endhint %}

## Creating a synthesizer

When creating your synthesizer, you are required to pass in a [Metadata](../../data-preparation/creating-metadata) object as the first argument.

```python
synthesizer = HMASynthesizer(metadata)
```

All other parameters are optional. You can include them to customize the synthesizer.

### Parameter Reference

**`locales`**: A list of locale strings. Any PII columns will correspond to the locales that you provide.

<table data-header-hidden><thead><tr><th width="218"></th><th></th></tr></thead><tbody><tr><td>(default) <code>['en_US']</code></td><td>Generate PII values in English corresponding to US-based concepts (eg. addresses, phone numbers, etc.)</td></tr><tr><td><code>&#x3C;list></code></td><td><p>Create data from the list of locales. Each locale string consists of a 2-character code for the language and 2-character code for the country, separated by an underscore.</p><p></p><p>For example <code>[</code><a href="https://faker.readthedocs.io/en/master/locales/en_US.html"><code>"en_US"</code></a><code>,</code> <a href="https://faker.readthedocs.io/en/master/locales/fr_CA.html"><code>"fr_CA"</code></a><code>]</code>. </p><p>For all options, see the <a href="https://faker.readthedocs.io/en/master/locales.html">Faker docs</a>.</p></td></tr></tbody></table>

```python
synthesizer = HMASynthesizer(
    metadata,
    locales=['en_US', 'en_CA', 'fr_CA']
)
```

`verbose`: A boolean describing whether or not to show the progress when fitting the synthesizer.

<table data-header-hidden><thead><tr><th width="187"></th><th></th></tr></thead><tbody><tr><td>(default) <code>True</code></td><td>Show the progress when fitting the synthesizer. You'll see printed progress bars during every stage of the fitting process: Preprocessing, learning relationships and modeling tables.</td></tr><tr><td><code>False</code></td><td>Do not show progress. The synthesizer will fit the data silently.</td></tr></tbody></table>

### set\_table\_parameters

The HMA Synthesizer is a multi-table algorithm that models each individual table as well as the connections between them. You can get and set the parameters for each individual table.

**Parameters**

* (required) `table_name`: A string describing the name of the table
* `table_parameters`: A dictionary mapping the name of the parameter (string) to the value of the parameter (various). See [GaussianCouplaSynthesizer](../../../../single-table-data/modeling/synthesizers/gaussiancopulasynthesizer#parameter-reference) for more details.

**Output** (None)

```python
synthesizer.set_table_parameters(
    table_name='guests',
    table_parameters={
        'enforce_min_max_values': True,
        'default_distribution': 'truncnorm',
        'numerical_distributions': { 
            'checkin_date': 'uniform',
            'amenities_fee': 'beta' }
    }
)
```

{% hint style="warning" %}
**Which distributions can I use with the HMA?** Please note that the HMA algorithm is only compatible with parametric distributions that have a predefined number of parameters. You will not be able to use the `'gaussian_kde'` distribution with HMA.
{% endhint %}

### get\_parameters

Use this function to access the all parameters your synthesizer uses -- those you have provided as well as the default ones.

**Parameters** (None)

**Output** A dictionary with the table names and parameters for each table.

{% hint style="info" %}
These parameters are only for the multi-table synthesizer. To get individual table-level parameters, use the `get_table_parameters` function.

The returned parameters are a copy. Changing them will not affect the synthesizer.
{% endhint %}

```python
synthesizer.get_parameters()
```

```python
{
    'locales': ['en_US', 'fr_CA'],
    ...
}
```

### get\_table\_parameters

Use this function to access the all parameters a table synthesizer uses -- those you have provided as well as the default ones.

**Parameters**

* (required) `table_name`: A string describing the name of the table

**Output** A dictionary with the parameter names and the values

```python
synthesizer.get_table_parameters(table_name='users')
```

```python
{
    'synthesizer_name': 'GaussianCopulaSynthesizer',
    'synthesizer_parameters': {
        'default_distribution': 'beta',
        ...
    }
}
```

### get\_metadata

Use this function to access the metadata object that you have included for the synthesizer

**Parameters** None

**Output** A [Metadata](../../data-preparation/creating-metadata) object

```python
metadata = synthesizer.get_metadata()
```

{% hint style="info" %}
The returned metadata is a copy. Changing it will not affect the synthesizer.
{% endhint %}

## Learning from your data

To learn a machine learning model based on your real data, use the `fit` method.

### fit

**Parameters**

* (required) `data`: A dictionary mapping each table name to a pandas.DataFrame containing the real data that the machine learning model will learn from

**Output** (None)

{% hint style="info" %}
**Technical Details:** HMA, which stands for _Hierarchical Modeling Algorithm_, uses a recursive technique to model the parent-child relationships of a multi-table datasets. At a base level, it uses Gaussian Copulas to model individual tables.&#x20;

See:

* [GaussianCopulaSynthesizer](../../../single-table-data/modeling/synthesizers/gaussiancopulasynthesizer) for more information on the GaussianCopula framework
* The [Synthetic Data vault paper](https://dai.lids.mit.edu/wp-content/uploads/2018/03/SDV.pdf), published in the International Conference on Data Science and Advance Analytics, October 2016
{% endhint %}

### get\_learned\_distributions

After fitting this synthesizer, you can access the marginal distributions that were learned to estimate the shape of each column.

**Parameters**

* (required) `table_name`: A string with the name of the table

**Output** A dictionary that maps the name of each learned column to the distribution that estimates its shape

```python
synthesizer.get_learned_distributions(table_name='guests')
```

```
{
    'amenities_fee': {
        'distribution': 'beta',
        'learned_parameters': { 'a': 2.22, 'b': 3.17, 'loc': 0.07, 'scale': 48.5 }
    },
    'checkin_date': { 
        ...
    },
    ...
}
```

For more information about the distributions and their parameters, visit the[ Copulas library](https://sdv.dev/Copulas/).

{% hint style="info" %}
Learned parameters are only available for parametric distributions. For eg. you will not be able to access learned distributions for the `'gaussian_kde'` technique.

In some cases, the synthesizer may not be able to fit the exact distribution shape you requested, so you may see another distribution shape (eg. `'truncnorm'` instead of `'beta'`).
{% endhint %}

## Saving your synthesizer

Save your trained synthesizer for future use.

### save

Use this function to save your trained synthesizer as a Python pickle file.

**Parameters**

* (required) `filepath`: A string describing the filepath where you want to save your synthesizer. Make sure this ends in `.pkl`

**Output** (None) The file will be saved at the desired location

```python
synthesizer.save(
    filepath='my_synthesizer.pkl'
)
```

### HMASynthesizer.load

Use this function to load a trained synthesizer from a Python pickle file

**Parameters**

* (required) `filepath`: A string describing the filepath of your saved synthesizer

**Output** Your synthesizer, as a HMASynthesizer object

```python
from sdv.multi_table import HMASynthesizer

synthesizer = HMASynthesizer.load(
    filepath='my_synthesizer.pkl'
)
```

## What's next?

After training your synthesizer, you can now sample synthetic data. See the [Sampling](../../sampling) section for more details.

{% hint style="info" %}
**Want to improve your synthesizer?** Input logical rules in the form of constraints, and customize the transformations used for pre- and post-processing the data.

For more details, see [Advanced Features](../customizations).
{% endhint %}

## FAQs

<details>

<summary>How do I cite the HMA?</summary>

_Neha Patki, Roy Wedge, Kalyan Veeramachaneni._ **The Synthetic data vault.** DSAA, 2016.

```
@inproceedings{
    HMA,
    title={The Synthetic data vault},
    author={Patki, Neha and Wedge, Roy and Veeramachaneni, Kalyan},
    booktitle={IEEE International Conference on Data Science and Advanced Analytics (DSAA)},
    year={2016},
    pages={399-410},
    doi={10.1109/DSAA.2016.49},
    month={Oct}
}
```

</details>

<details>

<summary>What happens if columns don't contain numerical data?</summary>

This synthesizer models non-numerical columns, including columns with missing values.

Although the HMA algorithm is designed for only numerical data, this synthesizer converts other data types using Reversible Data Transforms (RDTs). To access and modify the transformations, see [Advanced Features](../customizations).

</details>


# Sampling

Use these sampling methods to create synthetic data from your multi table model.&#x20;

## Sample Realistic Data

Create realistic synthetic data data that follows the same format and mathematical properties as the real data.

### sample

Use this function to create synthetic data that mimics the real data

```python
synthetic_data = synthesizer.sample(
    scale=1.5
)
```

**Parameters**

* `scale`: A float >0.0 that describes how much to scale the data by

<table data-header-hidden><thead><tr><th width="157"></th><th></th></tr></thead><tbody><tr><td>(default) <code>1</code></td><td>Don't scale the data. The model will create synthetic data that is roughly the same size as the original data.</td></tr><tr><td><code>>1</code></td><td>Scale the data by the specified factor. For example, <code>2.5</code> will create synthetic data that is roughly  2.5x the size of the original data.</td></tr><tr><td><code>&#x3C;1</code></td><td>Shrink the data by the specified pecentage. For example, <code>0.9</code> will create synthetic data that is roughtly 90% of the size of the original data.</td></tr></tbody></table>

**Returns** A dictionary that maps each table name (string) to a [pandas DataFrame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html) object with synthetic data for that table. The synthetic data mimics the real data.

{% hint style="info" %}
**How large will the synthetic data be?** During the fitting process, your SDV synthesizer learns the size of each data table. This is assumed to be a scale of 1. Scaling the entire dataset up or down means that the size of each table will change proportionally based on the original data size.&#x20;

Note that some synthesizers may perform small, additional algorithmic calculations to determine the final size of each table. However, you can still expect the final synthetic data to approximately follow the scale of the real data (with some minor deviations).
{% endhint %}

### reset\_sampling

Use this function to reset any randomization in sampling. After calling this, your synthesizer will generate the same data as before. For example in the code below, `synthetic_data1` and `synthetic_data2` are the same.

```python
synthesizer.reset_sampling()
synthetic_data1 = synthesizer.sample(scale=1.5)

synthesizer.reset_sampling()
synthetic_data2 = synthesizer.sample(scale=1.5)
```

**Parameters** None

**Returns** None. Resets the synthesizer.

## Export Your Data

After sampling, export the data back into its original format.

See the [Loading Data](data-preparation/loading-data) section for options.

# Evaluation

As a final step to your synthetic data project, you can evaluate and visualize the synthetic data against the real data.

```python
from sdv.evaluation.multi_table import run_diagnostic, evaluate_quality
from sdv.evaluation.multi_table import get_column_plot

# 1. perform basic validity checks
diagnostic = run_diagnostic(real_data, synthetic_data, metadata)

# 2. measure the statistical similarity
quality_report = evaluate_quality(real_data, synthetic_data, metadata)

# 3. plot the data
fig = get_column_plot(
    real_data=real_data,
    synthetic_data=synthetic_data,
    metadata=metadata,
    table_name='guests',
    column_name='amenities_fee'
)
    
fig.show()
```

Explore the functionaliy in more detail below.

<table data-view="cards"><thead><tr><th></th><th></th><th data-hidden data-card-target data-type="content-ref"></th></tr></thead><tbody><tr><td><a href="evaluation/diagnostic"><strong>Diagnostic</strong></a></td><td>Perform basic checks to ensure the synthetic data is valid.</td><td><a href="evaluation/diagnostic">diagnostic</a></td></tr><tr><td><a href="evaluation/data-quality"><strong>Data Quality</strong></a></td><td>Compare the real and synthetic data's statistical similarity.</td><td><a href="evaluation/data-quality">data-quality</a></td></tr><tr><td><a href="evaluation/visualization"><strong>Visualization</strong></a></td><td>Visualize the real and synthetic data side-by-side</td><td><a href="evaluation/visualization">visualization</a></td></tr></tbody></table>

## Need more evaluation options?

{% hint style="success" %}
**See the** [**SDMetrics library**](https://docs.sdv.dev/sdmetrics/)**.**

This library includes many more metrics (some experimental) that you can apply based on your goals. All you need is your real data, synthetic data and metadata to get started.
{% endhint %}


# Diagnostic

The Diagnostic Report runs some basic checks for data format and validity. Run this to ensure that you have created valid synthetic data.

## Usage

Run the diagnostic to receive a score and a corresponding report.

### run\_diagnostic

Use this function to run a diagnostic on the synthetic data.

```python
from sdv.evaluation.multi_table import run_diagnostic

diagnostic_report = run_diagnostic(
    real_data=real_data,
    synthetic_data=synthetic_data,
    metadata=metadata)
```

```
Generating report ...

(1/3) Evaluating Data Validity: |██████████| 15/15 [00:00<00:00, 603.69it/s]|
Data Validity Score: 100.0%

(2/3) Evaluating Data Structure: |██████████| 2/2 [00:00<00:00, 151.49it/s]|
Data Structure Score: 100.0%

(3/3) Evaluating Relationship Validity: |██████████| 1/1 [00:00<00:00, 68.51it/s]|
Relationship Validity Score: 100.0%

Overall Score (Average): 100.0%
```

**Parameters**:

* (required) `real_data`: A pandas.DataFrame containing the real data
* (required) `synthetic_data`: A pandas.DataFrame containing the synthetic data
* (required) `metadata`: A [Metadata](../../concepts/metadata) object with your metadata
* `verbose`: A boolean describing whether or not to print the report progress and results. Defaults to `True`. Set this to `False` to run the report silently.

**Returns**: An [SDMetrics DiagnosticReport](https://docs.sdv.dev/sdmetrics/reports/diagnostic-report/multi-table-api) object generated with your real and synthetic data

## Interpreting the Score

{% hint style="success" %}
**The score should be 100%.** The diagnostic report checks for basic data validity and data structure issues. You should expect the score to be perfect for any of the default SDV synthesizers.
{% endhint %}

### What's Included?

The basic diagnostic checks are summarized in the table below.

<table><thead><tr><th width="158">Property</th><th>Description</th></tr></thead><tbody><tr><td>Data Validity</td><td><p>Basic validity checks for each of the columns:</p><ol><li>Primary keys must always be unique and non-null</li><li>Continuous values in the synthetic data must adhere to the min/max range in the real data</li><li>Discrete values in the synthetic data must adhere to the same categories as the real data.</li></ol></td></tr><tr><td>Relationship Validity</td><td><p>Basic validity checks for each relationship between a parent table and a child table:</p><ol><li>Each primary key in the parent table must have an appropriate number of children (i.e. cardinality) based on the min/max of the real data.</li><li>Each foreign key in the child table must reference a primary key that exists in the parent (i.e. referential integrity).</li></ol></td></tr><tr><td>Structure</td><td>Checks to ensure the real and synthetic data have the same column names</td></tr></tbody></table>

### get\_details

This function returns details about the report's properties. Use it to pinpoint the exact columns or tables that are causing issues.

**Parameters**:

* (required) `property_name`: A string with the name of the property. One of: `'Data Validity'`, `'Structure'`, or `'Relationship Validity'`
* `table_name`: A string with the name of the table. If provided, you'll receive filtered results for the table.

**Returns** A pandas.DataFrame object with the detailed scores

```python
diagnostic_report.get_details(property_name='Data Validity')
```

```python
Table     Column	        Metric                   Score
guests    guest_email           KeyUniqueness            1.0
guests    had_rewards	        CategoryAdherence	 1.0
guests    room_type	        CategoryAdherence	 1.0
guests    amenities_fee	        BoundaryAdherence	 1.0
```

## FAQs

See the [SDMetrics DiagnosticReport](https://docs.sdv.dev/sdmetrics/reports/diagnostic-report) for even more details about the metrics and properties included in the report.

<details>

<summary>What should I do if the score is not 100%?</summary>

All of the default SDV synthesizers should yield a score of 100%. If this is not the case, please contact us with more details about your project via [GitHub](https://github.com/sdv-dev/SDV/issues/new/choose) or [Slack](https://bit.ly/sdv-slack-invite).

Note that you have changed any of the defaults — for example, if you have turned off min/max boundary enforcement — then the score may not be 100%.

</details>

<details>

<summary>How did you determine what the validity checks should be?</summary>

The items in this report answer the most basic, data validity questions that we have heard from our users and customers. We've collected thousands of pieces of feedback to come up with this basic set.

If you have any questions or suggestions, please contact us via [GitHub](https://github.com/sdv-dev/SDV/issues/new/choose) or [Slack](https://bit.ly/sdv-slack-invite).

</details>

<details>

<summary>Older versions of the Diagnostic report contained other metrics. Can I still use them?</summary>

Yes! You can compute additional metrics using our standalone [SDMetrics library](https://docs.sdv.dev/sdmetrics/).&#x20;

If you're used to older versions of the SDV, you may be looking for [NewRowSynthesis](https://docs.sdv.dev/sdmetrics/metrics/metrics-glossary/newrowsynthesis), [CategoryCoverage](https://docs.sdv.dev/sdmetrics/metrics/metrics-glossary/categorycoverage), and [RangeCoverage](https://docs.sdv.dev/sdmetrics/metrics/metrics-glossary/rangecoverage).&#x20;

</details>



# Data Quality

The Quality Report checks for statistical similarity between the real and the synthetic data. Use this to discover which patterns the synthetic data has captured from the real data.

## Usage

Run a quality report to receive a score and a corresponding report.

### evaluate\_quality

Use this function to run a diagnostic on the synthetic data.

```python
from sdv.evaluation.multi_table import evaluate_quality

quality_report = evaluate_quality(
    real_data=real_data,
    synthetic_data=synthetic_data,
    metadata=metadata)
```

```
Generating report ...

(1/4) Evaluating Column Shapes: |██████████| 15/15 [00:00<00:00, 564.15it/s]|
Column Shapes Score: 85.61%

(2/4) Evaluating Column Pair Trends: |██████████| 55/55 [00:00<00:00, 110.40it/s]|
Column Pair Trends Score: 71.97%

(3/4) Evaluating Cardinality: |██████████| 1/1 [00:00<00:00, 53.27it/s]|
Cardinality Score: 70.0%

(4/4) Evaluating Intertable Trends: |██████████| 50/50 [00:00<00:00, 86.54it/s]|
Intertable Trends Score: 68.49%

Overall Score (Average): 74.02%
```

**Parameters**:

* (required) `real_data`: A pandas.DataFrame containing the real data
* (required) `synthetic_data`: A pandas.DataFrame containing the synthetic data
* (required) `metadata`: A [Metadata](../../concepts/metadata) object with your metadata
* `verbose`: A boolean describing whether or not to print the report progress and results. Defaults to `True`. Set this to `False` to run the report silently.

**Returns**: An [SDMetrics QualityReport ](https://docs.sdv.dev/sdmetrics/reports/quality-report/multi-table-api)object generated with your real and synthetic data

## Interpreting the Score

{% hint style="success" %}
**Your score will vary from 0% to 100%.** This value tells you how similar the synthetic data is to the real data.

* A 100% score means that the patterns are exactly the same. For example, if you compared the real data with itself (identity), the score would be 100%.
* A 0% score means the patterns are as different as can be. This would entail that the synthetic data purposefully contains anti-patterns that are opposite from the real data.
* Any score in the middle can be interpreted along this scale. For example, a score of 80% means that the synthetic data is about 80% similar to the real data — about 80% of the trends are similar.

The quality score is expected to vary, and **you may never achieve exactly 100% quality**. That's ok! The SDV synthesizers are designed to estimate patterns, meaning that they may smoothen, extrapolate, or noise certain parts of the data.  For more information, see the [FAQs](#faqs).
{% endhint %}

### What's Included?

The different types of data quality are summarized in the table below.

<table><thead><tr><th width="158">Property</th><th>Description</th></tr></thead><tbody><tr><td>Column Shapes</td><td>The statistical similarity between the real and synthetic data for single columns of data. This is often called the <em>marginal distribution</em> of each column.</td></tr><tr><td>Column Pair Trends</td><td>The statistical similarity between the real and synthetic data for pairs of columns (within the same table). This is often called the <em>correlation</em> or <em>bivariate distributions</em> of the columns.</td></tr><tr><td>Cardinality</td><td>Within each parent/child relationship, the cardinality refers to the number of children that each parent has.</td></tr><tr><td>Intertable Trends</td><td>This is similar to column pair trends, but instead refers to columns between different tables. For example a column between a parent table and a different column in a child table.</td></tr></tbody></table>

### get\_details

This function returns details about the report's properties. Use it to pinpoint the exact columns or tables that are causing issues.

**Parameters**:

* (required) `property_name`: A string with the name of the property. One of: `'Column Shapes'`, `'Column Pair Trends'`, `'Cardinality'` or `'Intertable Trends'`.
* `table_name`: A string with the name of the table. If provided, you'll receive filtered results for the table.

**Returns** A pandas.DataFrame object with the detailed scores

```python
quality_report.get_details(property_name='Column Shapes', table_name='guests')
```

```python
Table        Column            Metric             Score
guests       amenities_fee     KSComplement       0.921127
guests       checkin_date      KSComplement       0.926000
...    
```

### save

Use this function to save the report object

{% hint style="success" %}
The report **does not save the full real and synthetic datasets.** But we still recommend using caution when deciding when to store the report and who to share it with. It does save the metadata along with the score for each property, breakdown and metric.
{% endhint %}

**Parameters**:

* (required) `filepath`: The name of file to save the object. This must end with `.pkl`

**Returns** (None) Saves the report as a file

```python
quality_report.save(filepath='results/quality_report.pkl')
```

### QualityReport.load

Use this function to load in a previously-saved quality report.

**Parameters**:

* (required) `filepath`: The name of the file where the report is stored

**Returns** An [SDMetrics QualityReport](https://docs.sdv.dev/sdmetrics/reports/quality-report/multi-table-api) object

```python
from sdmetrics.reports.multi_table import QualityReport

quality_report = QualityReport.load('results/quality_report.pkl')
```

## FAQs

See the [SDMetrics QualityReport](https://docs.sdv.dev/sdmetrics/reports/quality-report/whats-included) for even more details about the metrics and properties included in the report.

<details>

<summary>What can I do to improve the quality score?</summary>

We recommend using the report to get more detailed insight.

1. Identify which properties have low score
2. Use the [`get_details`](#get_details) method for those properties to identify which particular data columns or tables have the lowest scores.
3. If possible, [visualize](../../single-table-data/evaluation/visualization) the data to see how the synthetic data compares to the real data.

Using this information, you can update parameters or the data processing steps for the relevant columns. Refer to the [API docs](../../single-table-data/modeling) corresponding to your synthesizer and check the available [customizations](../../single-table-data/modeling/customizations).

_Note that it's ok — and even expected — to have a quality score that is not exactly 100%. Many of our users find that the synthetic data is still effective for downstream use._

</details>

<details>

<summary>If my score is very high, does that mean the synthetic data will have high utility?</summary>

A high score indicates a high level of statistical similarity between the real and the synthetic data in terms of the properties we've tested (column shapes and column pair trends). This is a proxy of the overall utility the synthetic data may have for your project, but it is not a guarantee.

The only way to capture true data utility is to use your synthetic data for its intended purpose (downstream application). We recommend trying this as soon as possible, iterating to improve your synthetic data.

If you need help with this, please contact us via [GitHub](https://github.com/sdv-dev/SDV/issues/new/choose) or [Slack](https://bit.ly/sdv-slack-invite).

</details>

<details>

<summary>This reports checks for patterns in 1 and 2-dimensions. Why not higher dimensions?</summary>

Higher order distributions of 3 or more columns are not included in the Quality Report. We have found that very high order similarity may have an adverse effect on the synthetic data. After a certain point, it indicates that the synthetic data is just a copy of the real data. (For more information, see the [NewRowSynthesis](https://docs.sdv.dev/sdmetrics/metrics/metrics-glossary/newrowsynthesis) metric.)&#x20;

If higher order similarity is a requirement, you likely have a targeted use case for synthetic data (eg. machine learning efficacy). Until we add these reports, you may want to explore other metrics in the [SDMetrics library](https://docs.sdv.dev/sdmetrics/metrics/metrics-glossary). You may also want to try directly using your synthetic data for the downstream application.

</details>

# Visualization

Use these functions to visualize your actual data in 1 or 2-dimensional space. This can help you see what kind of patterns the synthetic data has learned, and identify differences between the real and synthetic data.

### get\_column\_plot

Use this function to visualize a real column against the same synthetic column. You can plot any column of type: `boolean`, `categorical`, `datetime` or `numerical`.&#x20;

```python
from sdv.evaluation.multi_table import get_column_plot

fig = get_column_plot(
    real_data=real_data,
    synthetic_data=synthetic_data,
    metadata=metadata,
    table_name='guests',
    column_name='amenities_fee'
)
    
fig.show()
```

<figure><img src="https://1967107441-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FfNxEeZzl9uFiJ4Zf4BRZ%2Fuploads%2Flw30XrnR62mvfM4WO8ej%2FColumn%20Comparison.png?alt=media&#x26;token=d000af60-1580-4e57-9fe5-2b5ea9b135d9" alt=""><figcaption></figcaption></figure>

**Parameters**

* (required) `real_data`: A [pandas DataFrame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html) object containing the table of your real data. _To skip plotting the real data, input `None`._
* (required) `synthetic_data`: A [pandas DataFrame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html) object containing the synthetic data. _To skip plotting the synthetic data, input `None`._
* (required) `metadata`: A [Metadata](../../concepts/metadata) object that describes the columns
* (required) `table_name`: The name of the table
* (required) `column_name`: The name of the column you want to plot
* `plot_type`: The type of plot to create
  * (default) `None`: Determine an appropriate plot type based on your data type, as specified in the metadata.
  * `'bar'`: Plot the data as distinct bar graphs
  * `'displot'`: Plot the data as a smooth, continuous curves

**Output** A [plotly Figure](https://plotly.com/python-api-reference/generated/plotly.graph_objects.Figure.html) object that plots the distribution. This will change based on the sdtype.

{% hint style="info" %}
Use `fig.show()` to see the plot in an iPython notebook. The plot is interactive, allowing you to zoom, scroll and take screenshots.
{% endhint %}

### get\_column\_pair\_plot

Use this utility to visualize the trends between a pair of columns for real and synthetic data. You can plot any 2 columns of type: `boolean`, `categorical`, `datetime` or `numerical`. The columns do not have to the be the same type.

```python
from sdv.evaluation.multi_table import get_column_pair_plot

fig = get_column_pair_plot(
    real_data=real_data,
    synthetic_data=synthetic_data,
    metadata=metadata,
    table_name='guests',
    column_names=['room_rate', 'room_type'],
    )
    
fig.show()
```

**Parameters**

* (required) `real_data`: A [pandas DataFrame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html) object containing the table of your real data. _To skip plotting the real data, input `None`._
* (required) `synthetic_data`: A [pandas DataFrame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html) object containing the synthetic data. _To skip plotting the synthetic data, input `None`._
* (required) `metadata`: A [Metadata](../../concepts/metadata) object that describes the columns
* (required) `table_name`: The name of the table
* (required) `column_names`: A list with the names of the 2 columns you want to plot
* `plot_type`: The type of plot to create
  * (default) `None`: Determine an appropriate plot type based on your data type, as specified in the metadata.
  * `'box'`: Create a box plot showing the quartiles, broken down by different attributes
  * `'violin'`: Create a violin plot to show distributions, broken down by different attributes. This is an alternative to using `'box'`
  * `'heatmap'`: Create a side-by-side headmap showing the frequency of each pair of values
  * `'scatter'`: Create a scatter plot that plots each point on a 2D axis
* `sample_size`: The number of data points to plot
  * (default) `None`: Plot all the data points
  * `<integer>`: Subsample rows from both the real and synthetic data before plotting. Use this if you have a lot of data points.

**Output** A [plotly Figure](https://plotly.com/python-api-reference/generated/plotly.graph_objects.Figure.html) object that plots the 2D distribution. This will change based on the sdtype.

{% hint style="info" %}
Use `fig.show()` to see the plot in an iPython notebook. The plot is interactive, allowing you to zoom, scroll and take screenshots.
{% endhint %}

### get\_cardinality\_plot

Use this utility to visualize the cardinality of a multi-table relationship. The _cardinality_ refers to the number of child rows that each parent row has. This could be 0 or more.

```python
from sdv.evaluation.multi_table import get_cardinality_plot

fig = get_cardinality_plot(
    real_data=real_data,
    synthetic_data=synthetic_data,
    child_table_name='sessions',
    parent_table_name='users',
    child_foreign_key='user_id',
    metadata=metadata)
    
fig.show()
```

<figure><img src="https://1967107441-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FfNxEeZzl9uFiJ4Zf4BRZ%2Fuploads%2F4FQ8QOTjqBMXA62p8ic0%2FVisualization%20Cardinality.png?alt=media&#x26;token=7223cc0a-ee92-48a9-ab2b-ffcbea90ff29" alt=""><figcaption></figcaption></figure>

**Parameters**

* (required) `real_data`: A dictionary mapping each table name to a [pandas DataFrame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html) object with the real data
* (required) `synthetic_data`: A dictionary mapping each table name to a [pandas DataFrame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html) object with the synthetic data
* (required) `child_table_name`: A string describing the name of the child table in the relationship
* (required) `parent_table_name`: A string describing the name of the parent table in the relationship
* (required) `child_foreign_key`: A string describing the name of the foreign key column of the child table that references the parent table
* (required) `metadata`:  A [Metadata](../../concepts/metadata) object that describes the data

**Output** A [plotly Figure](https://plotly.com/python-api-reference/generated/plotly.graph_objects.Figure.html) object that plots the cardinality of the real vs. the synthetic data for the provided relationship.

{% hint style="info" %}
Use `fig.show()` to see the plot in an iPython notebook. The plot is interactive, allowing you to zoom, scroll and take screenshots.
{% endhint %}