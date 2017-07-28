package uit.aep.model;

import java.io.*;
import java.sql.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Created by Bean on 22-Jul-17.
 */
public class MTree {
    private String rootName;

    public MTree(String root) {
        this.rootName = root;
    }

    /**
     * Create a new graph Tree
     * Root: Topic Evolution
     * Root - [:has] -> days
     * Day - [:appears] -> topics
     * Topic - [:written_in] -> papers
     */
    public void createTree(LocalDate startDate, int sumOfdays) {

        try {
            Connection con = DriverManager.getConnection(
                    "jdbc:neo4j:bolt://localhost/?user=neo4j,password=1234567,scheme=basic");

            //format of datetime
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyyMMdd");


            Statement stmt = con.createStatement();
            stmt.execute("CREATE (n:Root {name : \"" + rootName + "\"})");


            for (int d = 0; d < sumOfdays; d++) {
                LocalDate nextDate = startDate.plusDays(d);
                String path = "C:\\Users\\Bean\\Downloads\\Result\\" + dtf.format(nextDate);

                String sql = "MATCH (r:Root)" +
                        "WHERE r.name = \"" + rootName + "\"" +
                        "CREATE (t:Timestamp {value : \"" + dtf.format(nextDate) + "\"} )<-[:has]-(r)";

                stmt.execute(sql);

                System.out.println(path);
                File folder = new File(path);
                File[] folders = folder.listFiles();
                for (File subfolder : folders) {
                    String sql2 = "MATCH (t:Timestamp)" +
                            "WHERE t.value = \"" + dtf.format(nextDate) + "\"" +
                            "CREATE (n:Topic {name : \"" + subfolder.getName() + "\"} )<-[:appears]-(t)";

                    stmt.execute(sql2);

                    File[] files = subfolder.listFiles();
                    for (File file : files) {
                        FileInputStream fstream = new FileInputStream(file);
                        DataInputStream in = new DataInputStream(fstream);
                        BufferedReader br = new BufferedReader(new InputStreamReader(in));
                        String strLine;
                        java.util.ArrayList<String> list = new java.util.ArrayList<String>();

                        while ((strLine = br.readLine()) != null) {
                            list.add(strLine);
                        }

                        String pathFile = file.getPath();
                        pathFile = pathFile.replace("\\", "/");
                        String sql3 = "MATCH (t:Topic)" + "WHERE t.name = \"" + subfolder.getName() + "\" "
                                + "CREATE (p:Paper {title: \"" + list.get(0)  + "\", url: \"" + list.get(2) + "\", pathFile: \"" + pathFile + "\"}) <-[:written_in]-(t)";
                        stmt.execute(sql3);
                    }
                }
            }
            con.close();
        } catch (SQLException e) {
            e.printStackTrace();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }


    public void importNewDataToTree(LocalDate localDate) {
        try {
            Connection con = DriverManager.getConnection(
                    "jdbc:neo4j:bolt://localhost/?user=neo4j,password=1234567,scheme=basic");

            //format of datetime
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyyMMdd");

            Statement stmt = con.createStatement();
            String path = "C:\\Users\\Bean\\Downloads\\Result\\" + dtf.format(localDate);

            String sql = "MATCH (r:Root)" +
                    "WHERE r.name = \"" + rootName + "\"" +
                    "CREATE (t:Timestamp {value : \"" + dtf.format(localDate) + "\"} )<-[:has]-(r)";
            stmt.execute(sql);

            System.out.println(path);
            File folder = new File(path);
            File[] folders = folder.listFiles();
            for (File subfolder : folders) {
                String sql2 = "MATCH (t:Timestamp)" +
                        "WHERE t.value = \"" + dtf.format(localDate) + "\"" +
                        "CREATE (n:Topic {name : \"" + subfolder.getName() + "\"} )<-[:appears]-(t)";

                stmt.execute(sql2);

                File[] files = subfolder.listFiles();
                for (File file : files) {
                    FileInputStream fstream = new FileInputStream(file);
                    DataInputStream in = new DataInputStream(fstream);
                    BufferedReader br = new BufferedReader(new InputStreamReader(in));
                    String strLine;
                    java.util.ArrayList<String> list = new java.util.ArrayList<String>();

                    while ((strLine = br.readLine()) != null) {
                        list.add(strLine);
                    }

                    String pathFile = file.getPath();
                    pathFile = pathFile.replace("\\", "/");
                    String sql3 = "MATCH (t:Topic)" + "WHERE t.name = \"" + subfolder.getName() + "\" "
                            + "CREATE (p:Paper {title: \"" + list.get(0) + "\", intro: \"" + list.get(3) + "\", url: \"" + list.get(2) + "\", pathFile: \"" + pathFile + "\"}) <-[:written_in]-(t)";
                    stmt.execute(sql3);
                }
            }
            con.close();
        } catch (SQLException e) {
            e.printStackTrace();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void main(String... args) {
        MTree mTree = new MTree("Topic Evolution");
        LocalDate localDate = LocalDate.of(2017, 7, 12);
        //mTree.createTree(localDate, 12);

          mTree.importNewDataToTree(localDate);
       // mTree.convertNeo4jDataToJson();
    }
}
